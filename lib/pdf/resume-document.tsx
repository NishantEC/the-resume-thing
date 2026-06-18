import type { ReactElement } from "react";
import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  groupItemsByKind,
  type Kind,
  type ResumeView,
} from "@/lib/resume/load";

const SECTIONS: { kind: Kind; label: string }[] = [
  { kind: "experience", label: "Experience" },
  { kind: "project", label: "Projects" },
  { kind: "skill", label: "Skills" },
  { kind: "highlight", label: "Highlights" },
];

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#111111",
    fontSize: 10,
    lineHeight: 1.4,
    paddingHorizontal: 48,
    paddingVertical: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
  },
  headline: {
    color: "#555555",
    fontSize: 12,
    marginTop: 2,
  },
  summary: {
    fontSize: 10,
    marginTop: 12,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    borderBottomColor: "#dddddd",
    borderBottomWidth: 1,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 2,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemContent: {
    fontSize: 10,
  },
  evidence: {
    color: "#777777",
    fontSize: 8,
    marginTop: 1,
  },
  evidenceLink: {
    color: "#777777",
    textDecoration: "none",
  },
});

export function ResumeDocument({
  view,
  name,
}: {
  view: ResumeView;
  name: string;
}): ReactElement {
  const grouped = groupItemsByKind(view.items);

  return (
    <Document title={`${name} — Resume`} author={name}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{name}</Text>
          {view.headline ? (
            <Text style={styles.headline}>{view.headline}</Text>
          ) : null}
        </View>

        {view.summary ? (
          <Text style={styles.summary}>{view.summary}</Text>
        ) : null}

        {SECTIONS.map(({ kind, label }) => {
          const items = grouped[kind];
          if (items.length === 0) return null;
          return (
            <View key={kind} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow} wrap={false}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemContent}>{item.content}</Text>
                    {item.evidence.length > 0 ? (
                      <Text style={styles.evidence}>
                        {item.evidence.map((e, i) => (
                          <Text key={`${e.url}-${i}`}>
                            {i > 0 ? "  ·  " : ""}
                            <Link src={e.url} style={styles.evidenceLink}>
                              {e.title || e.url}
                            </Link>
                          </Text>
                        ))}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

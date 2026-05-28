import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type { IGeneratedPaper, ISection, IQuestion, IAnswerKeyEntry } from '@vedaai/shared';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 50,
    paddingRight: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#666666',
  },

  headerBlock: {
    marginBottom: 12,
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subjectClass: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 10,
  },

  studentInfoBlock: {
    marginTop: 8,
    marginBottom: 12,
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-end',
  },
  studentInfoLabel: {
    fontSize: 10,
    marginRight: 4,
    width: 90,
  },
  studentInfoLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    flex: 1,
    height: 14,
  },

  instructionsBlock: {
    marginBottom: 10,
  },
  instructionsTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  instructionsText: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.4,
  },

  sectionBlock: {
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionInstruction: {
    fontSize: 9,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 8,
  },

  questionRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  questionNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 24,
    flexShrink: 0,
    paddingTop: 1,
  },
  questionBody: {
    flex: 1,
    flexDirection: 'column',
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  difficultyTag: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
    color: '#555555',
  },
  questionMarks: {
    fontSize: 9,
    color: '#555555',
  },
  questionText: {
    fontSize: 10,
    lineHeight: 1.5,
  },

  optionRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingLeft: 8,
  },
  optionLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 20,
    flexShrink: 0,
  },
  optionText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 1.4,
  },

  answerKeyTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  answerKeyRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  answerKeyNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 30,
    flexShrink: 0,
  },
  answerKeyAnswer: {
    fontSize: 10,
    flex: 1,
    lineHeight: 1.4,
  },
  answerKeySectionLabel: {
    fontSize: 9,
    color: '#666666',
    marginLeft: 4,
    flexShrink: 0,
  },
});

function difficultyTag(difficulty: IQuestion['difficulty']): string {
  switch (difficulty) {
    case 'Easy':     return '[Easy]';
    case 'Moderate': return '[Moderate]';
    case 'Hard':     return '[Hard]';
    default:         return '';
  }
}

function PageFooter() {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
      fixed
    />
  );
}

function QuestionItem({ question }: { question: IQuestion }) {
  return (
    <View style={styles.questionRow} wrap={false}>
      <Text style={styles.questionNumber}>{question.number}.</Text>
      <View style={styles.questionBody}>
        <View style={styles.questionMeta}>
          <Text style={styles.difficultyTag}>{difficultyTag(question.difficulty)}</Text>
          <Text style={styles.questionMarks}>[{question.marks} mark{question.marks !== 1 ? 's' : ''}]</Text>
        </View>
        <Text style={styles.questionText}>{question.text}</Text>
        {question.options && question.options.length > 0 && (
          <View style={{ marginTop: 5 }}>
            {question.options.map((opt) => (
              <View key={opt.label} style={styles.optionRow}>
                <Text style={styles.optionLabel}>{opt.label}.</Text>
                <Text style={styles.optionText}>{opt.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function SectionBlock({ section }: { section: ISection }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      {section.instruction ? (
        <Text style={styles.sectionInstruction}>{section.instruction}</Text>
      ) : null}
      <View style={styles.divider} />
      {section.questions.map((q) => (
        <QuestionItem key={q.number} question={q} />
      ))}
    </View>
  );
}

function AnswerKeyRow({ entry }: { entry: IAnswerKeyEntry }) {
  return (
    <View style={styles.answerKeyRow} wrap={false}>
      <Text style={styles.answerKeyNumber}>Q{entry.questionNumber}.</Text>
      <Text style={styles.answerKeyAnswer}>{entry.answer}</Text>
      <Text style={styles.answerKeySectionLabel}>({entry.sectionTitle})</Text>
    </View>
  );
}

interface PDFDocumentProps {
  paper: IGeneratedPaper;
}

export default function PDFDocument({ paper }: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageFooter />
        <View style={styles.headerBlock}>
          <Text style={styles.schoolName}>{paper.schoolName}</Text>
          <Text style={styles.subjectClass}>
            {paper.subject} — Class {paper.class.toLowerCase().startsWith('class') ? paper.class : `Class ${paper.class}`}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Time Allowed: {paper.timeAllowed} min</Text>
            <Text style={styles.metaText}>Total Marks: {paper.totalMarks}</Text>
          </View>
        </View>

        <View style={styles.studentInfoBlock}>
          {(['Name', 'Roll Number', 'Class / Section'] as const).map((label) => (
            <View key={label} style={styles.studentInfoRow}>
              <Text style={styles.studentInfoLabel}>{label}:</Text>
              <View style={styles.studentInfoLine} />
            </View>
          ))}
        </View>

        {paper.instructions ? (
          <View style={styles.instructionsBlock}>
            <Text style={styles.instructionsTitle}>General Instructions:</Text>
            <Text style={styles.instructionsText}>{paper.instructions}</Text>
          </View>
        ) : null}

        {paper.sections.map((section: ISection) => (
          <SectionBlock key={section.title} section={section} />
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <PageFooter />

        <Text style={styles.answerKeyTitle}>Answer Key</Text>

        {paper.answerKey.map((entry: IAnswerKeyEntry) => (
          <AnswerKeyRow key={entry.questionNumber} entry={entry} />
        ))}
      </Page>
    </Document>
  );
}

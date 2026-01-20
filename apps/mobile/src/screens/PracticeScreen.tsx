import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { questionsAPI } from '../services/api';
import { useSessionStore } from '../store/sessionStore';

interface Question {
  id: number;
  title: string;
  content: string;
  category: string;
  difficulty: string;
  marks: number;
  word_limit: number;
}

interface TodayData {
  questions: Question[];
  completed_count: number;
  total_count: number;
  today_completed: boolean;
  current_streak: number;
}

export default function PracticeScreen({ navigation }: any) {
  const [data, setData] = useState<TodayData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setQuestions, setConfig } = useSessionStore();

  const fetchQuestions = async () => {
    try {
      const todayData = await questionsAPI.getTodayQuestions();
      setData(todayData);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const handleStartSession = async () => {
    if (!data?.questions?.length) return;

    try {
      const questionData = await questionsAPI.getQuestion(data.questions[0].id);
      if (questionData.session_config) {
        setConfig(questionData.session_config);
      }
      setQuestions(data.questions);
      navigation.navigate('Session');
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  if (data?.today_completed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>You're All Done Today!</Text>
          <Text style={styles.completedSubtitle}>
            Amazing work! You've completed all your questions for today.
          </Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{data.current_streak} Day Streak</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e97422" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Today's Practice</Text>
          <Text style={styles.subtitle}>
            {data?.total_count} questions • {data?.completed_count} completed
          </Text>
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <View style={styles.phaseRow}>
            {[
              { icon: '📖', label: 'Read', time: '20s' },
              { icon: '🤔', label: 'Think', time: '30s' },
              { icon: '✍️', label: 'Write', time: '5m' },
            ].map((phase, index) => (
              <React.Fragment key={phase.label}>
                <View style={styles.phaseItem}>
                  <Text style={styles.phaseIcon}>{phase.icon}</Text>
                  <Text style={styles.phaseTime}>{phase.time}</Text>
                  <Text style={styles.phaseLabel}>{phase.label}</Text>
                </View>
                {index < 2 && <Ionicons name="arrow-forward" size={16} color="#4f46e5" />}
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStartSession}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Practice Session</Text>
          </TouchableOpacity>

          <Text style={styles.tip}>⚡ Make sure you have pen and paper ready</Text>
        </View>

        {/* Questions List */}
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Today's Questions</Text>
          {data?.questions?.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View
                  style={[
                    styles.questionNumber,
                    index < (data?.completed_count || 0) && styles.questionCompleted,
                  ]}
                >
                  {index < (data?.completed_count || 0) ? (
                    <Ionicons name="checkmark" size={16} color="#10b981" />
                  ) : (
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.questionTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{question.category}</Text>
                  </View>
                  <View
                    style={[
                      styles.tag,
                      { backgroundColor: `${getDifficultyColor(question.difficulty)}20` },
                    ]}
                  >
                    <Text
                      style={[styles.tagText, { color: getDifficultyColor(question.difficulty) }]}
                    >
                      {question.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.questionTitle}>{question.title}</Text>
              <View style={styles.questionMeta}>
                <Text style={styles.metaText}>{question.marks} marks</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{question.word_limit} words</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Better Practice</Text>
          <Text style={styles.tipsText}>• Use the thinking time to structure your answer</Text>
          <Text style={styles.tipsText}>• Write on paper to simulate exam conditions</Text>
          <Text style={styles.tipsText}>• Focus on quality over quantity</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070714',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6366f1',
  },
  sessionInfo: {
    backgroundColor: '#0f0e2a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  phaseItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  phaseIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  phaseTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e97422',
  },
  phaseLabel: {
    fontSize: 12,
    color: '#6366f1',
  },
  startButton: {
    backgroundColor: '#e97422',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e97422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  tip: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 16,
  },
  questionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  questionTags: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#a5b8fc',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6366f1',
  },
  metaDot: {
    fontSize: 14,
    color: '#6366f1',
    marginHorizontal: 8,
  },
  tipsCard: {
    backgroundColor: 'rgba(233, 116, 34, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(233, 116, 34, 0.3)',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#a5b8fc',
    marginBottom: 4,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  completedEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 32,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 116, 34, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(233, 116, 34, 0.5)',
  },
  streakEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e97422',
  },
});

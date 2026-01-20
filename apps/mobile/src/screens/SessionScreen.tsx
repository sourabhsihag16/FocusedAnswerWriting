import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useSessionStore, SessionPhase } from '../store/sessionStore';
import { sessionsAPI, streakAPI } from '../services/api';

export default function SessionScreen({ navigation }: any) {
  const {
    currentQuestion,
    currentQuestionIndex,
    questions,
    phase,
    timeRemaining,
    totalSessionTime,
    config,
    completedQuestions,
    setPhase,
    setTimeRemaining,
    incrementTotalTime,
    completeQuestion,
    nextQuestion,
    resetSession,
    startSession,
  } = useSessionStore();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const warningPlayedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  // Play beep sound
  const playBeep = useCallback(async (frequency: 'low' | 'high' = 'high') => {
    try {
      // Haptic feedback
      await Haptics.notificationAsync(
        frequency === 'high'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      
      // Vibration
      Vibration.vibrate(frequency === 'high' ? 200 : 400);
    } catch (error) {
      console.log('Haptic/vibration not available');
    }
  }, []);

  // Initialize session
  useEffect(() => {
    if (questions.length === 0) {
      navigation.goBack();
      return;
    }

    const initSession = async () => {
      try {
        const response = await sessionsAPI.startSession(questions[0].id);
        setSessionId(response.session_id);
        startSession(response.session_id, questions[0]);
        playBeep('high');
      } catch (error) {
        console.error('Failed to start session:', error);
        Alert.alert('Error', 'Failed to start session');
        navigation.goBack();
      }
    };

    initSession();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed') return;

    const interval = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);
      incrementTotalTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timeRemaining]);

  // Phase transition
  useEffect(() => {
    if (timeRemaining <= 0 && phase !== 'idle' && phase !== 'completed') {
      handlePhaseComplete();
    }

    // Warning at 30 seconds in writing phase
    if (phase === 'writing' && timeRemaining === 30 && !warningPlayedRef.current) {
      warningPlayedRef.current = true;
      playBeep('low');
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (phase !== 'writing') {
      warningPlayedRef.current = false;
      pulseAnim.setValue(1);
    }
  }, [timeRemaining, phase]);

  // Handle phase completion
  const handlePhaseComplete = useCallback(async () => {
    playBeep('high');

    switch (phase) {
      case 'reading':
        setPhase('thinking');
        break;
      case 'thinking':
        setPhase('writing');
        break;
      case 'writing':
        if (currentQuestion) {
          completeQuestion(currentQuestion.id);

          if (sessionId) {
            try {
              await sessionsAPI.completeSession(sessionId, totalSessionTime);
            } catch (e) {
              console.error('Failed to save session:', e);
            }
          }
        }

        if (currentQuestionIndex < questions.length - 1) {
          try {
            const response = await sessionsAPI.startSession(
              questions[currentQuestionIndex + 1].id
            );
            setSessionId(response.session_id);
            nextQuestion();
          } catch (e) {
            console.error('Failed to start next session:', e);
            setPhase('completed');
          }
        } else {
          setPhase('completed');
          try {
            await streakAPI.completeDay();
          } catch (e) {
            console.error('Failed to update streak:', e);
          }
        }
        break;
    }
  }, [phase, currentQuestion, sessionId, totalSessionTime, currentQuestionIndex, questions]);

  const handleExit = () => {
    Alert.alert(
      'Exit Session?',
      'Your progress won\'t be saved. Are you sure?',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            resetSession();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    resetSession();
    navigation.goBack();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = () => {
    switch (phase) {
      case 'reading':
        return { label: 'Reading', icon: 'book-outline', color: '#3b82f6' };
      case 'thinking':
        return { label: 'Thinking', icon: 'bulb-outline', color: '#f59e0b' };
      case 'writing':
        return { label: 'Writing', icon: 'pencil-outline', color: '#10b981' };
      default:
        return { label: 'Ready', icon: 'time-outline', color: '#6366f1' };
    }
  };

  const phaseInfo = getPhaseInfo();

  // Completed state
  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>Session Complete!</Text>
          <Text style={styles.completedSubtitle}>
            You've completed all {questions.length} questions!
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedQuestions.length}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(totalSessionTime / 60)}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleComplete}>
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressDots}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < currentQuestionIndex && styles.dotCompleted,
                i === currentQuestionIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Ionicons name="close" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Phase Indicator */}
      <View style={[styles.phaseIndicator, { backgroundColor: `${phaseInfo.color}20` }]}>
        <Ionicons name={phaseInfo.icon as any} size={20} color={phaseInfo.color} />
        <Text style={[styles.phaseText, { color: phaseInfo.color }]}>{phaseInfo.label} Phase</Text>
      </View>

      {/* Timer */}
      <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[styles.timer, timeRemaining <= 10 && styles.timerWarning]}>
          {formatTime(timeRemaining)}
        </Text>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${
                ((getPhaseTotal() - timeRemaining) / getPhaseTotal()) * 100
              }%`,
              backgroundColor: phaseInfo.color,
            },
          ]}
        />
      </View>

      {/* Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.questionTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{currentQuestion?.category}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {currentQuestion?.marks} marks • {currentQuestion?.word_limit} words
            </Text>
          </View>
        </View>
        <Text style={styles.questionTitle}>{currentQuestion?.title}</Text>
        <Text style={styles.questionContent}>{currentQuestion?.content}</Text>
      </View>

      {/* Phase Instructions */}
      <View style={styles.instructions}>
        {phase === 'reading' && (
          <Text style={styles.instructionText}>📖 Read and understand the question carefully</Text>
        )}
        {phase === 'thinking' && (
          <Text style={styles.instructionText}>🤔 Plan your answer structure in your mind</Text>
        )}
        {phase === 'writing' && (
          <Text style={styles.instructionText}>✍️ Write your answer on paper now!</Text>
        )}
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.totalTime}>Total: {formatTime(totalSessionTime)}</Text>
      </View>
    </SafeAreaView>
  );

  function getPhaseTotal(): number {
    switch (phase) {
      case 'reading':
        return config.read_time_seconds;
      case 'thinking':
        return config.think_time_seconds;
      case 'writing':
        return config.write_time_seconds;
      default:
        return 1;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070714',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e1b4b',
  },
  dotCompleted: {
    backgroundColor: '#10b981',
  },
  dotActive: {
    backgroundColor: '#e97422',
    width: 24,
  },
  exitButton: {
    padding: 8,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 32,
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timer: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerWarning: {
    color: '#ef4444',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#1e1b4b',
    borderRadius: 4,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: '#0f0e2a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e1b4b',
    marginBottom: 24,
  },
  questionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#a5b8fc',
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  questionContent: {
    fontSize: 16,
    color: '#a5b8fc',
    lineHeight: 24,
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
  },
  bottomInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1b4b',
  },
  totalTime: {
    fontSize: 14,
    color: '#4f46e5',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#1e1b4b',
  },
  doneButton: {
    backgroundColor: '#e97422',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#e97422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

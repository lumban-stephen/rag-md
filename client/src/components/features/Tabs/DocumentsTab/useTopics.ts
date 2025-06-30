import { useState, useCallback } from 'react';
import { getAllTopics } from '../../../../services/api/index';

export function useTopics() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>('');

  const fetchTopics = useCallback(async () => {
    try {
      const topicsList = await getAllTopics();
      const uniqueTopics = Array.from(new Set((topicsList as string[]).filter(Boolean)))
        .sort((a: string, b: string) => a.localeCompare(b));
      setTopics(uniqueTopics as string[]);
    } catch (error) {
      setTopics([]);
    }
  }, []);

  return {
    topics,
    selectedTopic,
    setSelectedTopic,
    fetchTopics,
  };
} 
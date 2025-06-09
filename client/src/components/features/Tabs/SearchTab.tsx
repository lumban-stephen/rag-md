/**
 * SearchTab Component
 * Provides a search interface for documents with topic filtering
 * Displays search results with highlighted matches and copy functionality
 */
import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, AlertCircle, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import { searchDocuments, getDocuments } from '../../../services/api';
import { SearchResult } from '../../../types';
import toast from 'react-hot-toast';

const SearchTab: React.FC = () => {
  // State for search query and topic filter
  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // State for available topics
  const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);

  // Fetch available topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getDocuments();
        if (response.topics) {
          const uniqueTopics = Array.from(new Set(response.topics.filter(Boolean)));
          setTopics(uniqueTopics.map(topic => ({
            value: topic,
            label: topic
          })));
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
        toast.error('Failed to load topics');
      }
    };
    fetchTopics();
  }, []);

  /**
   * Handles the search operation
   * Validates query and calls the search API
   */
  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchDocuments(query, selectedTopic || undefined);
      // Limit results to 3 and reset previous results
      setResults(searchResults.slice(0, 3));
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching documents:', error);
      toast.error('Failed to search documents');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Copies text to clipboard and shows feedback
   * @param text - Text to copy
   * @param id - ID of the result being copied
   */
  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copied to clipboard!', {
        icon: '📋',
        duration: 2000,
      });
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  /**
   * Highlights search terms in the result text
   * @param text - Text to highlight terms in
   * @returns HTML string with highlighted terms
   */
  const highlightSearchTerms = (text: string) => {
    if (!query.trim()) return text;
    
    const terms = query.trim().split(/\s+/).filter(t => t.length > 2);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Search input card */}
        <Card>
          <CardHeader>
            <CardTitle>Search Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search query input */}
              <div className="md:col-span-3">
                <TextArea
                  label="Enter your query"
                  placeholder="What would you like to search for?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  fullWidth
                  rows={3}
                />
              </div>
              {/* Topic filter dropdown */}
              <div>
                <Select
                  label="Filter by topic (optional)"
                  options={topics}
                  value={selectedTopic}
                  onChange={(selectedValue) => {
                    setSelectedTopic(selectedValue);
                    setResults([]); // Reset results when changing topic
                    setHasSearched(false); // Reset search state
                  }}
                  fullWidth
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSearch}
              isLoading={isSearching}
              disabled={!query.trim() || isSearching}
              icon={<SearchIcon className="h-4 w-4" />}
            >
              Search
            </Button>
          </CardFooter>
        </Card>

        {/* Search results card */}
        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>
                Search Results
                {results.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({results.length} {results.length === 1 ? 'result' : 'results'})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                // No results found state
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mb-4" />
                  <p className="text-lg">No results found</p>
                  <p className="text-sm mt-2">Try a different search term or topic</p>
                </div>
              ) : (
                // Results list
                <div className="space-y-6">
                  {results.map((result, index) => (
                    <div key={`${result.id}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      {/* Result header with metadata */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <h3 className="text-sm font-semibold text-blue-600">
                            Source: {result.filename}
                          </h3>
                          <div className="text-xs text-gray-500 mt-1">
                            File ID: {result.id}
                          </div>
                        </div>
                        {/* Confidence score and copy button */}
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Confidence: {(result.confidence * 100).toFixed(0)}%
                          </div>
                          <button
                            onClick={() => handleCopyToClipboard(result.snippet, result.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === result.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      {/* Result content with highlighted terms */}
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Content:</p>
                        <p 
                          className="text-gray-600 text-sm bg-gray-50 p-3 rounded"
                          dangerouslySetInnerHTML={{ __html: highlightSearchTerms(result.snippet) }}
                        ></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchTab;
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIRecommendations from '../src/pages/admin/AIRecommendations';
import apiClient from '../src/api/client';

describe('Multilingual AI Chatbot Frontend Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('orderwise_token', 'mock_jwt_token');
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    apiClient.get = vi.fn().mockImplementation((url) => {
      if (url === '/orders') {
        return Promise.resolve({ success: true, data: { orders: [] } });
      }
      return Promise.resolve({ success: true, data: {} });
    });

    apiClient.post = vi.fn().mockImplementation((url, body) => {
      if (url === '/auth/login') {
        return Promise.resolve({ data: { token: 'mock_jwt_token' } });
      }
      if (url === '/ai/chat') {
        const lang = body.language || 'en';
        let reply = 'Here is the inventory analysis in English.';
        let label = 'English';

        if (lang === 'mr' || body.message.includes('dakhva') || body.message.includes('दाखवा')) {
          reply = 'हा घ्या तुमचा कमी साठा असलेला अहवाल.';
          label = 'मराठी';
        } else if (lang === 'hi' || body.message.includes('dikhao') || body.message.includes('कम')) {
          reply = 'ये रहा आपका कम स्टॉक वाला इन्वेंटरी विश्लेषण।';
          label = 'हिन्दी';
        }

        return Promise.resolve({
          success: true,
          data: {
            reply,
            suggestions: ['Follow up 1', 'Follow up 2'],
            detectedLanguage: lang,
            languageLabel: label,
            provider: 'groq',
            model: 'llama3-70b-8192',
          },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });
  });

  it('renders chatbot tab and displays language selector button and online badge', async () => {
    render(<AIRecommendations />);

    // Click on Interactive AI Assistant Chatbot tab
    const chatbotTab = screen.getByRole('button', { name: /Interactive AI Assistant Chatbot/i });
    fireEvent.click(chatbotTab);

    // Verify header title and online status
    expect(screen.getByText('OrderWise Intelligent Co-Pilot Chatbot')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Verify Language Selector button exists with default English
    const langBtn = screen.getByTestId('language-selector-button');
    expect(langBtn).toBeInTheDocument();
    expect(langBtn).toHaveTextContent(/English/i);

    // Verify Language Indicator badge exists
    const langIndicator = screen.getByTestId('language-indicator');
    expect(langIndicator).toBeInTheDocument();
    expect(langIndicator).toHaveTextContent(/English/i);
  });

  it('opening dropdown displays English, हिन्दी, and मराठी options', async () => {
    render(<AIRecommendations />);

    fireEvent.click(screen.getByRole('button', { name: /Interactive AI Assistant Chatbot/i }));

    const langBtn = screen.getByTestId('language-selector-button');
    fireEvent.click(langBtn);

    // Verify dropdown menu opens with all 3 options
    expect(screen.getByTestId('language-dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('language-option-en')).toHaveTextContent(/English/i);
    expect(screen.getByTestId('language-option-hi')).toHaveTextContent(/हिन्दी/i);
    expect(screen.getByTestId('language-option-mr')).toHaveTextContent(/मराठी/i);
  });

  it('switching language to Hindi persists to localStorage, updates prompts & placeholder, and preserves chat history', async () => {
    render(<AIRecommendations />);

    fireEvent.click(screen.getByRole('button', { name: /Interactive AI Assistant Chatbot/i }));

    // Verify initial English suggestions
    expect(screen.getByText(/Show low-stock products/i)).toBeInTheDocument();

    // Open dropdown and switch to हिन्दी
    fireEvent.click(screen.getByTestId('language-selector-button'));
    fireEvent.click(screen.getByTestId('language-option-hi'));

    // Check localStorage persistence
    expect(localStorage.getItem('orderwise_chat_lang')).toBe('hi');

    // Check language indicator updated to हिन्दी
    expect(screen.getByTestId('language-indicator')).toHaveTextContent('हिन्दी');

    // Check suggested prompts updated to Hindi / Hinglish
    expect(screen.getByText(/Kam stock wale products dikhao/i)).toBeInTheDocument();
    expect(screen.getByText(/Kaunse suppliers ki delivery late hai/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending purchase orders dikhao/i)).toBeInTheDocument();

    // Check input placeholder adapted to Hindi
    expect(screen.getByPlaceholderText(/OrderWise AI se puchein/i)).toBeInTheDocument();

    // Chat history preserved (welcome message still visible)
    expect(screen.getAllByText(/OrderWise AI Assistant/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switching language to Marathi updates suggestions to Marathi and persists', async () => {
    render(<AIRecommendations />);

    fireEvent.click(screen.getByRole('button', { name: /Interactive AI Assistant Chatbot/i }));

    // Open dropdown and select मराठी
    fireEvent.click(screen.getByTestId('language-selector-button'));
    fireEvent.click(screen.getByTestId('language-option-mr'));

    expect(localStorage.getItem('orderwise_chat_lang')).toBe('mr');
    expect(screen.getByTestId('language-indicator')).toHaveTextContent('मराठी');

    // Verify Marathi prompts appear
    expect(screen.getByText(/कमी स्टॉक असलेल्या वस्तू दाखवा/i)).toBeInTheDocument();
    expect(screen.getByText(/कोणत्या पुरवठादारांची डिलिव्हरी उशिरा आहे/i)).toBeInTheDocument();
    expect(screen.getByText(/प्रलंबित खरेदी ऑर्डर दाखवा/i)).toBeInTheDocument();

    // Verify Marathi placeholder
    expect(screen.getByPlaceholderText(/OrderWise AI ला विचारा/i)).toBeInTheDocument();
  });

  it('sending chat sends selected language in API payload and displays language tag on response', async () => {
    render(<AIRecommendations />);

    fireEvent.click(screen.getByRole('button', { name: /Interactive AI Assistant Chatbot/i }));

    // Switch to Hindi
    fireEvent.click(screen.getByTestId('language-selector-button'));
    fireEvent.click(screen.getByTestId('language-option-hi'));

    // Click on suggested prompt
    const promptBtn = screen.getByText(/Kam stock wale products dikhao/i);
    fireEvent.click(promptBtn);

    // Verify API called with language: 'hi'
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ai/chat',
        expect.objectContaining({
          message: 'Kam stock wale products dikhao',
          language: 'hi',
        })
      );
    });

    // Verify response message rendered with Hindi language badge
    await waitFor(() => {
      expect(screen.getByText('ये रहा आपका कम स्टॉक वाला इन्वेंटरी विश्लेषण।')).toBeInTheDocument();
      expect(screen.getAllByText('हिन्दी').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows mid-conversation language switching without wiping messages', async () => {
    render(<AIRecommendations />);

    fireEvent.click(screen.getByRole('button', { name: /Interactive AI Assistant Chatbot/i }));

    // Send an English query
    const input = screen.getByPlaceholderText(/Ask OrderWise AI/i);
    fireEvent.change(input, { target: { value: 'Show low-stock products.' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Show low-stock products.')).toBeInTheDocument();
      expect(screen.getByText('Here is the inventory analysis in English.')).toBeInTheDocument();
      expect(screen.queryByText(/analyzing allocation rules/i)).not.toBeInTheDocument();
    });

    // Now switch mid-conversation to Marathi
    fireEvent.click(screen.getByTestId('language-selector-button'));
    fireEvent.click(screen.getByTestId('language-option-mr'));

    // English messages must STILL be present in the conversation
    expect(screen.getByText('Show low-stock products.')).toBeInTheDocument();
    expect(screen.getByText('Here is the inventory analysis in English.')).toBeInTheDocument();

    // Send a Marathi query via suggested prompt button or form
    const mrPromptBtn = screen.getByText(/कमी स्टॉक असलेल्या वस्तू दाखवा/i);
    fireEvent.click(mrPromptBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ai/chat',
        expect.objectContaining({
          message: 'कमी स्टॉक असलेल्या वस्तू दाखवा',
          language: 'mr',
        })
      );
      expect(screen.getByText('हा घ्या तुमचा कमी साठा असलेला अहवाल.')).toBeInTheDocument();
    });
  });
});

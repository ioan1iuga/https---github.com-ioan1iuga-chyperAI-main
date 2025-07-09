// Method to calculate cost based on provider and model
calculateCost(provider, model, usage) {
  const pricing = {
    [import.meta.env.VITE_OPENAI_PROVIDER_ID || 'openai']: {
      [import.meta.env.VITE_OPENAI_GPT4_MODEL_ID || 'gpt-4']: { 
        input: parseFloat(import.meta.env.VITE_OPENAI_GPT4_INPUT_COST || '0.03'), 
        output: parseFloat(import.meta.env.VITE_OPENAI_GPT4_OUTPUT_COST || '0.06') 
      },
      [import.meta.env.VITE_OPENAI_GPT35_MODEL_ID || 'gpt-3.5-turbo']: { 
        input: parseFloat(import.meta.env.VITE_OPENAI_GPT35_INPUT_COST || '0.0015'), 
        output: parseFloat(import.meta.env.VITE_OPENAI_GPT35_OUTPUT_COST || '0.002') 
      }
    },
    [import.meta.env.VITE_ANTHROPIC_PROVIDER_ID || 'anthropic']: {
      [import.meta.env.VITE_ANTHROPIC_OPUS_MODEL_ID || 'claude-3-opus-20240229']: { 
        input: parseFloat(import.meta.env.VITE_ANTHROPIC_OPUS_INPUT_COST || '0.015'), 
        output: parseFloat(import.meta.env.VITE_ANTHROPIC_OPUS_OUTPUT_COST || '0.075') 
      },
      [import.meta.env.VITE_ANTHROPIC_SONNET_MODEL_ID || 'claude-3-sonnet-20240229']: { 
        input: parseFloat(import.meta.env.VITE_ANTHROPIC_SONNET_INPUT_COST || '0.003'), 
        output: parseFloat(import.meta.env.VITE_ANTHROPIC_SONNET_OUTPUT_COST || '0.015') 
      },
      [import.meta.env.VITE_ANTHROPIC_HAIKU_MODEL_ID || 'claude-3-haiku-20240307']: { 
        input: parseFloat(import.meta.env.VITE_ANTHROPIC_HAIKU_INPUT_COST || '0.00025'), 
        output: parseFloat(import.meta.env.VITE_ANTHROPIC_HAIKU_OUTPUT_COST || '0.00125') 
      }
    },
    [import.meta.env.VITE_GOOGLE_PROVIDER_ID || 'google']: {
      [import.meta.env.VITE_GOOGLE_GEMINI_PRO_MODEL_ID || 'gemini-pro']: { 
        input: parseFloat(import.meta.env.VITE_GOOGLE_GEMINI_PRO_INPUT_COST || '0.00025'), 
        output: parseFloat(import.meta.env.VITE_GOOGLE_GEMINI_PRO_OUTPUT_COST || '0.0005') 
      },
      [import.meta.env.VITE_GOOGLE_GEMINI_VISION_MODEL_ID || 'gemini-pro-vision']: { 
        input: parseFloat(import.meta.env.VITE_GOOGLE_GEMINI_VISION_INPUT_COST || '0.00025'), 
        output: parseFloat(import.meta.env.VITE_GOOGLE_GEMINI_VISION_OUTPUT_COST || '0.0005') 
      }
    }
  };
}
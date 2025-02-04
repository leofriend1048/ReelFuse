import OpenAI from 'openai';

interface VisualHookDescriptions {
    hookDescription1: string;
    hookDescription2: string;
    hookDescription3: string;
    hookDescription4: string;
    hookDescription5: string;
  }

const client = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function gpt3TranscriptionAnalysis(transcript: string) {
  try {
    const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert direct response copywriter analyzing the transcript from a winning ad' },
          { 
            role: 'user', 
            content: `Please review the transcript of a video advertisement. Provide a detailed analysis of the tone and the style of copywriting. Consider the following in your evaluation:

Tone: Describe the emotional and conversational quality of the ad. Is it formal or informal? Cheerful, somber, humorous, or straightforward? How does the tone fit the product or service being advertised?

Style of Copywriting:

Language Use: Discuss the choice of words. Are they simple, complex, technical, or colloquial? How do they contribute to the overall message?
Sentence Structure: Analyze the complexity or simplicity of the sentences. Are they short and punchy, or long and descriptive? How does this affect the clarity and impact of the ad?
Rhetorical Devices: Identify any use of metaphors, similes, alliteration, or rhetorical questions. How do these elements enhance or detract from the message?
Persuasive Techniques: Point out any methods used to persuade the audience, such as appeals to emotion, logic, or credibility.
Target Audience: Who is the intended audience for this advertisement? How do the tone and style of the copywriting cater to this specific group?

Effectiveness: Based on your analysis, evaluate how effectively the ad's tone and style of copywriting serve its purpose. Does it engage the intended audience and clearly convey its message?

Transcript: ${transcript}`
          }
        ],
        model: 'gpt-3.5-turbo',
      });
    return chatCompletion;
  } catch (error) {
    console.error("Error calling OpenAI to generate completion:", error);
    throw error;
  }
}

export async function gptHookVisualDescription(transcript: any): Promise<VisualHookDescriptions> {
  try {
    const visualHookCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert direct response advertiser, specializing in advertising on social media. I have summarized the key points into the 8 categories below from a bunch of Michael Todd Beauty reviews for their Sonicsmooth Pro+. Instantly reveal younger, smoother, softer, more radiant skin with Michael Todd Beauty award-winning, at-home sonic dermaplaning system paired with microdermabrasion tips. Sonicsmooth Pro+ is dermatologist approved for quick, easy, and painless exfoliation and peach fuzz removal. Preps skin for better skincare absorption Removes build-up on top layer of skin Flawless makeup application I want you to read them and then answer some questions about them, okay? In each category, I have listed 5 points with the ones that are most common first. 1. Main Unique Value Propositions Provides effective exfoliation and removal of dead skin. Simple and easy to use. Instant improvement in skin smoothnes and appearance. Fast shipping and product arrives in great condition. Helps in achieving a flawless makeup application due to smoother skin. Helps to fade the appearance of fine lines and wrinkles. 2. Unique Features/Benefits Dermatologist-approved for safe, at-home dermaplaning. Painless exfoliation and peach fuzz removal. Promotes better skincare absorption by removing build-up. Comes with replaceable, stainless steel surgical grade dermaplaning tips for hygiene and effectiveness. 3. Customer Pain Points Dealing with severe acne or skin reactions post-use. Confusion regarding post-use skincare routine to avoid adverse reactions. Lack of clear instructions on maintenance and usage (e.g., charging, shaving directions). Difficulty in treating certain areas, like the chin, effectively. High cost relative to perceived effectiveness. 4. Customer Desired Outcomes Smoother, softer, and more radiant skin. Effective removal of peach fuzz for a cleaner skin surface. Enhanced skincare product absorption. Long-lasting and visible improvements in skin texture. Confidence boost through improved skin appearance. 5. Customer Purchase Prompts Desire for at-home, dermatologist-approved skincare tools. Need for a simple and effective exfoliation solution. Interest in improving skincare and makeup application. Looking for a solution to remove dead skin and peach fuzz. Recommendations or awards highlighting the products effectiveness. 6. Customer Misconceptions Assuming hair will grow back thicker. Thats not the case since its only vellus hair. That is a myth. That the product could be used without causing any skin reactions. Misunderstanding about the ease of use without needing in-depth instructions. Expectation that one solution fits all skin types without potential adverse effects. Assuming the product would not require frequent charging. Belief that the high cost directly correlates with superior performance for all users. 7. Customer Failed Solutions Other exfoliation methods that did not provide desired smoothness or were painful. Previous skincare tools that were not as effective or easy to use. Manual dermaplaning or professional services that were more expensive or less convenient. Various skincare products that failed to improve skin texture or absorbency. Traditional razors or hair removal methods that were less efficient or caused irritation. 8. Customer Objections Concerns about the products effectiveness given its high cost. Worries about potential skin reactions or acne post-use. Doubts about the products ease of use without comprehensive instructions. Hesitation due to the need for frequent charging impacting convenience. Fear that results would not justify the investment or match advertised outcomes. Here are a few winning hooks: - If you are over 50 and you are not dermaplaning then you are making a big mistake - At-home dermaplaning is the botox of 2024 - I canceled my botox appointment for this - This is why I dumped plastic razors for good - "In my 10 years as a master esthetician, I have only trusted one at-home anti-aging treatment" - Women over 50 are switching to Sonicsmooth Here are a few concepts for winning hooks: - Before vs After - How Tos - Ask Questions - Controversial Opinions - Checklist For - Trends - Habits - Research - Truths and Facts - Myth-busting - Common Mistakes - Tips and Tricks - Best Tools - Problem Callouts - Unboxing - Secrets - Use Cases - Results Of - Surprising Benefits - Satirical Skit Here are a few templates for winning hooks: - How ______ _______ in just # days - How _____ is _____, and What to Do About It - How do _____ really _____? - How I Made/Lost _____ in X Days - How I Went from _____ to _____ in Y Days/Months - How to _____ and _____ - Are You Leaving _____ on the Table? - Your # Biggest Questions About _____ Answered - Who Else Wants to _____? - Is _____ Harming Your _____? - Is _____ Causing You to Lose/Miss Out on _____? - Frequently Asked Questions (and Answers) About _____ - Do You Really Need _____ to _____? - Can You Recognize All # Warning Signs of _____? - Can We All Agree Its Time to Stop _____ Now? - Answers to All the Questions You Have About _____ But Were Too Afraid to Ask' },
        { role: 'user', content: `Now, you are an expert direct response advertiser, specializing in advertising on social media. Given all the information above, I want you to come up with 5 descriptions of visual hooks. These don't have to be related to the non-visual hook you have already created above.

Consider the following:

- This is a social media ad, so the visuals need to be engaging to keep people watching. Crazy/exaggerated visuals often perform well - especially ones that emphasise the value propositions of the product.
- These visuals will be shot by creators on their iPhones. Whilst you can (and should) propose more ambitious shots, remember that we do not have big budget production crews or special effects available to us.
- Your visual hooks can either be Aroll or Broll.


See below for a transcript from a winning ad you are making hook visual iterations for. The hook descriptions can be related to the angle of the ad below but they need to draw in viewer's attention to continue watching. Please use a variety of hook visuals. ${transcript}` },
      ],
      model: 'gpt-3.5-turbo',
      tools: [
        {
          type: "function",
          function: {
            name: "generate_visual_hooks",
            description: "Generate engaging visual hooks for a product ad.",
            parameters: {
              type: "object",
              properties: {
                hookDescription1: { type: "string", description: "Description of the visual hook 1." },
                hookDescription2: { type: "string", description: "Description of the visual hook 2." },
                hookDescription3: { type: "string", description: "Description of the visual hook 3." },
                hookDescription4: { type: "string", description: "Description of the visual hook 4." },
                hookDescription5: { type: "string", description: "Description of the visual hook 5." },
              },
              required: ["hookDescription1", "hookDescription2", "hookDescription3", "hookDescription4", "hookDescription5"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const hooks = visualHookCompletion.choices.map(choice => {
      if (choice.message.tool_calls) {
        return JSON.parse(choice.message.tool_calls[0].function.arguments);
      }
      return null;
    }).filter(hook => hook !== null);

    return hooks[0]; // Return the first set of hooks, or adjust as needed
  } catch (error) {
    console.error("Error calling OpenAI to generate visual hook descriptions:", error);
    throw error;
  }
}
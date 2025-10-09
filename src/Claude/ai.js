import {claude} from '@/Config/api_services'
import Anthropic from '@anthropic-ai/sdk'

export async function claude_getQuestions(description){
    const msg = await claude.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        temperature:1,
        system:'You are a Business Analysis that is helping a client to create a feedback form for new testers to test their website from a summary of their website. The feedback form should only include open ended questions. Ensure that your response is in a format that can be split into an array by a javascript function using |||. As your response will only be read by the javascript function, do not include anything unnecessary.',
        messages: [
      {
        role: "user",
        "content": [
                {
                    "type": "text",
                    "text": description
                }
            ]
      }
    ]
    })
    console.log('Claude Msg:',msg);
    const question_arr = msg.content[0].text.split("|||")
    return question_arr
}
import Lmnt from 'lmnt-node'

export const lmnt = new Lmnt({
  apiKey: process.env['LMNT_API_KEY'] // This is the default and can be omitted
})

export const { voices, speech } = lmnt

// const response = await client.speech.generate({ text: 'hello world.', voice: 'ava' });

// const content = await response.blob();
// console.log(content);

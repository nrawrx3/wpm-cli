#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import {readFileSync} from 'fs';
import unidecode from 'unidecode';
import natural from 'natural';

const cli = meow(
	`
	Usage
	  $ wpm-cli

	Options
		--inputfile, -i  The input file to read from
		--width, -w      The width of the box to render (default 80)

	Examples
	  $ wpm-cli --inputfile=input.txt --width=80
`,
	{
		importMeta: import.meta,
		flags: {
			inputfile: {
				type: 'string',
				alias: 'i',
				isRequired: true,
			},
			width: {
				type: 'number',
				alias: 'w',
				default: 80,
			},
		},
	},
);

function tokenize(text: string): string[] {
	const tokenizer = new natural.WordTokenizer();

	text = unidecode(text.normalize());
	text = text.replace(/\n/g, ' ');
	return tokenizer.tokenize(text)!!;
}

// Open the file and read the text, convert to a list of characters.
// Pass the list of characters to the app.
let file = readFileSync(cli.flags.inputfile, 'utf8');
const words = tokenize(file);

render(<App words={words} boxWidth={cli.flags.width} />);

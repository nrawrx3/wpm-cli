import React, {useState} from 'react';
import {Text, Box, useInput, useApp} from 'ink';
import BigText from 'ink-big-text';

type Props = {
	words: string[];
	boxWidth: number;
};

type CurrentWordState = {
	isCorrect: boolean;
	typedLength: number; // How many characters of the word have been typed
	word: string;
	wordIndex: number;
	wrongCharacterIndices: number[];
	expectSpaceKey: boolean;
};

export default function App(props: Props) {
	if (props.words.length === 0) {
		return <Text>No words provided</Text>;
	}

	type AppState = 'typing' | 'result';

	const [appState, setAppState] = useState<AppState>('typing');
	const [wordState, setCurrentWordState] = useState<CurrentWordState>({
		isCorrect: true,
		typedLength: 0,
		word: props.words[0]!!,
		wordIndex: 0,
		wrongCharacterIndices: [],
		expectSpaceKey: false,
	});

	const [typingStartTime, setTypingStartTime] = useState<number>(0);
	const [wpm, setWpm] = useState<number>(0);
	const [accuracy, setAccuracy] = useState<number>(0);

	const [wrongWordIndices, setWrongWordIndices] = useState<number[]>([]);
	const [lastWrongWordIndexPushed, setLastWrongWordIndexPushed] =
		useState<number>(-1);

	const [typedText, setTypedText] = useState<string[]>([]);
	const {exit} = useApp();

	const recalculateStats = () => {
		if (typingStartTime === 0) {
			return;
		}

		const elapsedSeconds = (Date.now() - typingStartTime) / 1000;
		const elapsedMinutes = elapsedSeconds / 60;
		const wpm = (wordState.wordIndex + 1) / elapsedMinutes;

		let accuracy = 0;

		if (wordState.wordIndex > 0) {
			accuracy = 1.0 - wrongWordIndices.length / (wordState.wordIndex + 1);
			accuracy *= 100.0;
		}

		setWpm(wpm);
		setAccuracy(accuracy);
	};

	const addNewWrongWordIndex = (index: number) => {
		if (lastWrongWordIndexPushed !== index) {
			setWrongWordIndices([...wrongWordIndices, index]);
			setLastWrongWordIndexPushed(index);
		}
	};

	const incrementCursor = (input: string) => {
		if (wordState.expectSpaceKey) {
			const nextWordIndex = wordState.wordIndex + 1;
			const setWrongWord = input !== ' ';

			// Move to next word if available.
			if (nextWordIndex === props.words.length) {
				setAppState('result');
				// exit();
				return;
			}

			setCurrentWordState({
				...wordState,
				typedLength: 0,
				word: props.words[nextWordIndex]!!,
				wordIndex: nextWordIndex,
				expectSpaceKey: false,
			});

			if (setWrongWord) {
				addNewWrongWordIndex(wordState.wordIndex);
			}

			setTypedText([]);
			recalculateStats();
			return;
		}

		// Wrong character
		if (
			input.toLowerCase() !==
			wordState.word[wordState.typedLength]!!.toLowerCase()
		) {
			// console.log(
			// 	`Wrong character: ${input}, expected ${
			// 		wordState.word[wordState.typedLength]
			// 	}`,
			// );
			const wrongCharacterIndices = [
				...wordState.wrongCharacterIndices,
				wordState.typedLength,
			];

			setCurrentWordState({
				...wordState,
				isCorrect: false,
				wrongCharacterIndices,
			});

			addNewWrongWordIndex(wordState.wordIndex);
			recalculateStats();
			return;
		}

		// console.log('Correct character: ' + input);

		const newTypedLength = wordState.typedLength + 1;
		const newExpectSpaceKey = newTypedLength === wordState.word.length;

		setCurrentWordState({
			...wordState,
			typedLength: newTypedLength,
			expectSpaceKey: newExpectSpaceKey,
		});
		setTypedText([...typedText, input]);

		if (typingStartTime === 0) {
			setTypingStartTime(Date.now());
		}
		recalculateStats();
	};

	useInput((input, key) => {
		if (appState !== 'typing') {
			return;
		}
		if (key.return) {
			setCurrentWordState({...wordState, typedLength: 0});
		}
		incrementCursor(input);
	});

	if (appState === 'result') {
		setTimeout(() => {
			exit();
		}, 500);
		return (
			<Box gap={2}>
				<BigText text={`${Math.floor(wpm)},`} />
				<BigText text={`${Math.floor(accuracy)}`} />
			</Box>
		);
	}

	return (
		<Box
			width={`${props.boxWidth}`}
			borderStyle="round"
			borderLeft
			borderRight
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			paddingLeft={1}
			paddingRight={1}
		>
			<Box
				borderStyle="single"
				borderBottom
				borderTop={false}
				borderLeft={false}
				borderRight={false}
				borderColor="red"
				width="100%"
				paddingLeft={2}
				justifyContent="space-between"
				flexDirection="row-reverse"
			>
				<Text color={wpmColor(wpm)} bold>
					WPM
				</Text>
				<Box width="15%">
					<Stats accuracy={accuracy} wpm={wpm} />
				</Box>
			</Box>
			{appState === 'typing' ? (
				<Box width="100%">
					<Box paddingLeft={2} paddingTop={1} flexWrap="nowrap">
						<RunningText
							words={props.words}
							wrongWordIndices={wrongWordIndices}
							currentWordIndex={wordState.wordIndex}
							currentWordTypedLength={wordState.typedLength}
							boxWidth={props.boxWidth}
						/>
					</Box>
				</Box>
			) : null}
			<Box width="100%" marginTop={1}>
				<Box>
					<Text>{'>'}</Text>
				</Box>
				<Box marginLeft={1} flexShrink={0}>
					<Text>{typedText.join('')}_</Text>
				</Box>
			</Box>
		</Box>
	);
}

function wpmColor(wpm: number) {
	wpm = Math.floor(wpm);
	let wpmColor = 'blue';
	if (wpm <= 50) {
		wpmColor = 'red';
	} else if (wpm <= 70) {
		wpmColor = 'yellow';
	} else if (wpm <= 90) {
		wpmColor = 'green';
	}
	return wpmColor;
}

type StatsProps = {
	accuracy: number;
	wpm: number;
};

function Stats(props: StatsProps) {
	return (
		<Box justifyContent="space-between" width="100%">
			<Box flexGrow={0} flexShrink={0} width="40%">
				<Text color={wpmColor(props.wpm)}>{Math.floor(props.wpm)}</Text>
			</Box>
			<Box flexGrow={0} flexShrink={0} width="40%">
				<Text>{Math.floor(props.accuracy)}%</Text>
			</Box>
		</Box>
	);
}

type RunningTextProps = {
	words: string[];
	wrongWordIndices: number[];
	currentWordIndex: number;
	currentWordTypedLength: number;

	boxWidth: number;
};

function maxSliceLength(words: string[], start: number, n: number) {
	let total = 0;
	let i = start;
	while (total < n && i < words.length) {
		total += words[i]!!.length;
		i++;
	}
	return i;
}

function RunningText(props: RunningTextProps) {
	// Render the text with some text from left of current location and some text from right of current location

	const startingLocation = Math.max(props.currentWordIndex, 0);

	// Find how long we can extend the window to the right without going over BOX_WIDTH characters

	let endingLocation = Math.min(
		props.currentWordIndex + 10,
		props.words.length,
	);

	endingLocation = maxSliceLength(
		props.words,
		startingLocation,
		props.boxWidth,
	);

	const wordsWindow = props.words.slice(startingLocation, endingLocation);

	let ellipsisLocation = 999999;

	return (
		<Box width="100%" flexWrap="wrap" gap={1}>
			{wordsWindow.map((word, index) => {
				const actualIndex = startingLocation + index;
				const isWrong = props.wrongWordIndices.includes(actualIndex);

				const isCurrent = actualIndex === props.currentWordIndex;

				return (
					<Word
						word={word}
						isCurrent={isCurrent}
						isWrong={isWrong}
						key={index}
						ellipsis={actualIndex >= ellipsisLocation}
						currentWordTypedLength={props.currentWordTypedLength}
					/>
				);
			})}
		</Box>
	);
}

function Word(
	props: {
		word: string;
		isCurrent?: boolean;
		isWrong?: boolean;
		currentWordTypedLength?: number;
		ellipsis?: boolean;
	} & React.PropsWithChildren,
) {
	// If current word being typed, we will render it character by character.
	if (props.isCurrent && props.currentWordTypedLength !== undefined) {
		return (
			<Box flexShrink={0} padding={0}>
				{props.word.split('').map((char, index) => {
					const isWrong =
						props.isWrong && index < props.currentWordTypedLength!!;

					return (
						<Text
							color={isWrong ? 'red' : undefined}
							underline={index === props.currentWordTypedLength}
							key={index}
						>
							{char}
						</Text>
					);
				})}
			</Box>
		);
	}

	return (
		<Box flexShrink={0} padding={0}>
			<Text
				color={props.isWrong || props.ellipsis ? 'red' : undefined}
				underline={props.isCurrent}
				backgroundColor={props.ellipsis ? 'yellow' : undefined}
			>
				{props.word}
			</Text>
		</Box>
	);
}

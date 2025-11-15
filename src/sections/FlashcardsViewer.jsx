import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom'; // Used to get the fileId
import axios from 'axios';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, RefreshCw, Check, X, Loader2, BookOpen } from 'lucide-react';
import * as Tone from 'tone'; // Sound library

// --- Configuration and Types ---

// Base URL for API
const API_BASE_URL = "/cloud/file/view";
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

// Voice configurations for TTS if needed, but here used for simple tones/synths
const synth = new Tone.PolySynth(Tone.Synth).toDestination();
const toneC = new Tone.MembraneSynth().toDestination();
const toneF = new Tone.MembraneSynth().toDestination();

/**
 * Interface for a single flashcard item.
 */
const CARD_TYPES = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  IDENTIFICATION: 'Identification',
  TRUE_OR_FALSE: 'True or False',
  ENUMERATION: 'Enumeration',
};

// --- Custom Components ---

/**
 * 1. Animated Gradient Background Component
 * FIX: Removed non-standard 'global' and 'jsx' attributes from <style>
 */
const AnimatedGradientBackground = () => (
  <style>{`
    @keyframes pulse-gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animated-bg {
      background: linear-gradient(-45deg, #4f46e5, #3b82f6, #6366f1, #2563eb);
      background-size: 400% 400%;
      animation: pulse-gradient 15s ease infinite;
    }
  `}</style>
);

/**
 * 2. Fun Loader Component
 */
const FunLoader = ({ message = "QuickRev is loading your flashcards..." }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="w-16 h-16 text-indigo-600" />
    </motion.div>
    <h2 className="mt-4 text-xl font-bold text-gray-800">{message}</h2>
    <p className="text-sm text-gray-500 mt-1">Getting ready for the review!</p>
  </motion.div>
);

/**
 * 3. Mode Selection Modal
 */
const ModeSelectionModal = ({ onSelectMode }) => {
  const modes = [
    { id: 'normal', name: 'Normal Mode', icon: BookOpen, desc: 'Answer, check, and flip. Great for learning and self-testing.' },
    { id: 'quiz', name: 'Quiz Mode', icon: Zap, desc: 'No instant check/flip. Score is displayed at the end for a true quiz experience.' },
    { id: 'shuffle-normal', name: 'Shuffle Normal', icon: RefreshCw, desc: 'Randomized cards with instant check/flip for varied practice.' },
    { id: 'shuffle-quiz', name: 'Shuffle Quiz', icon: Zap, desc: 'Randomized cards. True quiz experience with final score.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.7, y: 50, opacity: 0 }}
        className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-2xl"
      >
        <h2 className="text-3xl font-extrabold text-indigo-600 mb-6 text-center">
          Choose a Game Mode
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {modes.map(mode => (
            <motion.button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="p-4 text-left border border-gray-200 rounded-xl hover:border-indigo-500 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start">
                <mode.icon className="w-6 h-6 text-indigo-500 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{mode.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{mode.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * 4. Countdown Component
 * FIX: Modified sound playing functions and useEffect to ensure Tone.js stability
 * and prevent "Start time must be strictly greater" error.
 */
const Countdown = ({ onComplete }) => {
  const [count, setCount] = useState(3);

  const playCountSound = useCallback(() => {
    // Ensure Tone.js is started and schedule sound slightly after Tone.now()
    Tone.start().then(() => {
      toneC.triggerAttackRelease("C4", "8n", Tone.now() + 0.05);
    });
  }, []);

  const playGoSound = useCallback(() => {
    // Ensure Tone.js is started and schedule sound slightly after Tone.now()
    Tone.start().then(() => {
      toneF.triggerAttackRelease("F4", "4n", Tone.now() + 0.05);
    });
  }, []);

  useEffect(() => {
    // FIX: Wrap initial play in a timeout to separate from immediate strict mode double-run
    const initialTimeout = setTimeout(() => {
      playCountSound();
    }, 0);

    const interval = setInterval(() => {
      setCount(prev => {
        if (typeof prev !== 'number') return prev; // If it's 'Go!', stop here

        if (prev - 1 > 0) {
          playCountSound();
          return prev - 1;
        } else {
          clearInterval(interval);
          playGoSound();
          setTimeout(onComplete, 500); // Allow 'Go!' to be displayed
          return 'Go!';
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout); // FIX: Cleanup initial timeout as well
    };
  }, [onComplete, playCountSound, playGoSound]);

  return (
    <motion.div
      key={count}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'backOut' }}
      className="fixed inset-0 z-40 flex items-center justify-center text-white font-extrabold"
    >
      <span className="text-9xl sm:text-[10rem] drop-shadow-lg [text-shadow:0_0_20px_rgba(79,70,229,0.8)]">
        {count}
      </span>
    </motion.div>
  );
};

/**
 * 5. Audio Feedback Functions
 * FIX: Added Tone.start() for robustness, ensuring audio context is ready.
 */
const playCorrectSound = () => {
  Tone.start().then(() => {
    synth.triggerAttackRelease(["C5", "E5", "G5"], "8n");
  });
};

const playWrongSound = () => {
  Tone.start().then(() => {
    synth.triggerAttackRelease("C3", "4n");
  });
};

// --- Main App Component ---

const FlashcardsViewer = () => {
  const { fileId } = useParams(); // Get fileId from route params
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [mode, setMode] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  // REMOVED: const [isFlipped, setIsFlipped] = useState(false);
  
  // userAnswers now includes per-card state like isFlipped
  const [userAnswers, setUserAnswers] = useState({}); // { 0: { answer: '...', isCorrect: true, checked: true, isFlipped: false }, ... }
  const [isChecking, setIsChecking] = useState(false); // To prevent multiple checks

  const [showModal, setShowModal] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Memoize the current card and total count for easy access
  const currentCard = allCards[currentCardIndex];
  const totalCards = allCards.length;
  const cardData = userAnswers[currentCardIndex] || {};

  // --- Utility Functions ---

  /**
   * Cleans and normalizes answers for case-insensitive checking.
   * Handles both single string and array inputs.
   */
  const normalizeAnswer = (answer) => {
    if (Array.isArray(answer)) {
      return answer.map(a => String(a).trim().toLowerCase());
    }
    return String(answer).trim().toLowerCase();
  };

  /**
   * Robust comparison logic for different card types.
   */
  const compareAnswers = (userAns, correctAns, type) => {
    if (!userAns) return false;

    const normalizedUserAns = normalizeAnswer(userAns);
    const normalizedCorrectAns = normalizeAnswer(correctAns);

    if (type === CARD_TYPES.ENUMERATION) {
      // For enumeration, userAns is an object of inputs: {0: 'a', 1: 'b'}
      const userList = Object.values(userAns).filter(Boolean);
      const normalizedUserList = normalizeAnswer(userList);

      // Check if all correct answers are present in the user's answers (order doesn't matter)
      return normalizedCorrectAns.every(cAns => normalizedUserList.includes(cAns));
    }

    if (type === CARD_TYPES.IDENTIFICATION) {
      // Correct Answer can be an array or string, treat it as a list of possibilities
      const correctOptions = Array.isArray(normalizedCorrectAns) ? normalizedCorrectAns : [normalizedCorrectAns];
      return correctOptions.includes(normalizedUserAns);
    }

    // For MC and T/F (single answer string)
    return normalizedUserAns === normalizedCorrectAns;
  };

  // --- Data Fetching ---

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINT}${API_BASE_URL}?file_id=${fileId}`);
        
        let data;
        try {
            data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (parseError) {
            console.error("Failed to parse flashcard data:", parseError);
            throw new Error("Invalid flashcard file format. Could not parse JSON.");
        }

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Flashcard file is empty or formatted incorrectly.");
        }

        setAllCards(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching flashcards:", err);
        setError(err.message || "Failed to load flashcards. Check API endpoint and file ID.");
        setLoading(false);
      }
    };

    if (fileId) {
      fetchData();
    } else {
      setError("No file ID provided. Cannot load flashcards.");
      setLoading(false);
    }
  }, [fileId]);

  // --- Game Logic ---

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    setShowModal(false);

    let cards = [...allCards];
    const isShuffle = selectedMode.includes('shuffle');

    if (isShuffle) {
      // Fisher-Yates shuffle algorithm
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
    }
    setAllCards(cards);

    // Start countdown
    setShowCountdown(true);
  };

  const handleUserAnswerChange = (e, index = null) => {
    const { value, type } = e.target;
    let newAnswer = value;

    if (currentCard.Type === CARD_TYPES.ENUMERATION) {
      // Handle Enumeration, storing multiple inputs in an object
      const currentEnumAnswers = cardData.answer || {};
      newAnswer = { ...currentEnumAnswers, [index]: value };
    } else if (type === 'radio') {
      newAnswer = value;
    }

    setUserAnswers(prev => ({
      ...prev,
      [currentCardIndex]: {
        ...cardData,
        answer: newAnswer,
        checked: false, // Reset checked status on new input
      },
    }));
  };

  const handleCheckAnswer = () => {
    if (!currentCard || isChecking || cardData.checked) return;
    setIsChecking(true);

    const isCorrect = compareAnswers(cardData.answer, currentCard["Correct Answer"], currentCard.Type);

    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setUserAnswers(prev => ({
      ...prev,
      [currentCardIndex]: {
        ...cardData,
        isCorrect: isCorrect,
        checked: true,
        // Automatically flip to the back (answer) side upon checking in Normal mode
        isFlipped: true, // NEW: Auto-flip on check
      },
    }));

    setIsChecking(false);
  };

  const calculateScore = useCallback(() => {
    let correctCount = 0;
    for (let i = 0; i < totalCards; i++) {
      const card = allCards[i];
      const answer = userAnswers[i]?.answer;
      if (answer && compareAnswers(answer, card["Correct Answer"], card.Type)) {
        correctCount++;
      }
    }
    setQuizScore(correctCount);
  }, [allCards, totalCards, userAnswers]);

  const handleNavigation = (delta) => {
    const nextIndex = currentCardIndex + delta;

    if (nextIndex >= 0 && nextIndex < totalCards) {
      // If in Quiz mode, auto-check the current card before moving
      if (mode?.includes('quiz') && !cardData.checked) {
        // We calculate correctness but don't show the result until the end
        const isCorrect = compareAnswers(cardData.answer, currentCard["Correct Answer"], currentCard.Type);
        setUserAnswers(prev => ({
          ...prev,
          [currentCardIndex]: {
            ...cardData,
            isCorrect: isCorrect,
            checked: true,
            isFlipped: false, // Ensure it's not flipped when navigating away
          },
        }));
      }

      // Reset flip state for the new card (if not in the userAnswers map yet, or if moving)
      setCurrentCardIndex(nextIndex);
    } else if (nextIndex === totalCards && mode?.includes('quiz') && quizScore === null) {
      // End of Quiz mode
      calculateScore();
    }
  };

  // UPDATED: Use per-card state for flip
  const handleFlipCard = () => {
    const isNormalMode = mode?.includes('normal');
    // Only available in Normal modes
    if (!isNormalMode) return;
    
    setUserAnswers(prev => ({
        ...prev,
        [currentCardIndex]: {
            ...cardData,
            isFlipped: !cardData.isFlipped, // Toggle the card's individual flip state
        },
    }));
  };

  // --- Animation/Drag Logic ---
  const controls = useAnimation();
  const [isSwiping, setIsSwiping] = useState(false);

  // Drag handlers using useDrag are now removed. We rely on motion.div drag props.
  const dragHandlers = useMemo(() => ({
    onDragStart: () => setIsSwiping(true),
    onDragEnd: (event, info) => {
      setIsSwiping(false);
      const dragThreshold = 50; // Pixels needed to trigger a navigation

      if (info.offset.x > dragThreshold) {
        handleNavigation(-1); // Swipe right (Previous)
      } else if (info.offset.x < -dragThreshold) {
        handleNavigation(1); // Swipe left (Next)
      } else {
        // Snap back if not enough drag
        controls.start({ x: 0 });
      }
    },
    onDrag: (event, info) => {
        // Prevent vertical scrolling from triggering drag on mobile
        if (Math.abs(info.delta.y) > Math.abs(info.delta.x) * 2) {
            // Cancel horizontal drag if vertical motion is dominant
            setIsSwiping(false);
            return;
        }
    },
  }), [controls, currentCardIndex, totalCards, mode, cardData, quizScore, calculateScore, handleNavigation]);

  // --- Input Rendering Subcomponents ---

  const renderInputArea = () => {
    const userAns = cardData.answer;
    const isNormalMode = mode?.includes('normal');
    const isChecked = cardData.checked;
    const isCorrect = cardData.isCorrect;

    const getBaseClass = (valueToCheck) => {
      let base = "p-3 mb-3 border-2 rounded-xl text-lg transition-all duration-300 cursor-pointer";
      const isSelected = String(userAns) === String(valueToCheck);

      if (isNormalMode && isChecked) {
        const isAnswerCorrect = compareAnswers(valueToCheck, currentCard["Correct Answer"], currentCard.Type);

        if (isAnswerCorrect) {
          return base + " bg-green-100 border-green-500 text-green-800 font-semibold shadow-md";
        }
        if (isSelected && !isAnswerCorrect) {
          return base + " bg-red-100 border-red-500 text-red-800 font-semibold shadow-md";
        }
        // If it's checked but not the correct one, it's neutral unless it was the user's wrong choice
        return base + " bg-white border-gray-200 text-gray-700 hover:border-gray-300";

      } else {
        // Normal state or Quiz Mode
        if (isSelected) {
          return base + " bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold shadow-md";
        }
        return base + " bg-white border-gray-200 text-gray-700 hover:border-indigo-300";
      }
    };

    switch (currentCard.Type) {
      case CARD_TYPES.MULTIPLE_CHOICE:
      case CARD_TYPES.TRUE_OR_FALSE:
        const choices = currentCard.Type === CARD_TYPES.TRUE_OR_FALSE ? ['True', 'False'] : currentCard.Choices;
        return (
          <div className="flex flex-col space-y-3 mt-4">
            {choices.map((choice, i) => (
              <label key={i} className={getBaseClass(choice)}>
                <input
                  type="radio"
                  name="choice"
                  value={choice}
                  checked={userAns === choice}
                  onChange={handleUserAnswerChange}
                  disabled={isNormalMode && isChecked}
                  className="mr-3 text-indigo-600 focus:ring-indigo-500 h-5 w-5 border-gray-300"
                />
                {choice}
              </label>
            ))}
          </div>
        );

      case CARD_TYPES.IDENTIFICATION:
        const inputClass = `w-full p-4 border-2 rounded-xl text-lg transition-all duration-300 mt-4 focus:ring-indigo-500 focus:border-indigo-500 shadow-md ${
          isNormalMode && isChecked
            ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
            : 'border-gray-300'
        }`;
        return (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Type your answer here..."
              value={userAns || ''}
              onChange={handleUserAnswerChange}
              disabled={isNormalMode && isChecked}
              className={inputClass}
            />
          </div>
        );

      case CARD_TYPES.ENUMERATION:
        const correctAnswers = currentCard["Correct Answer"];
        const numInputs = Array.isArray(correctAnswers) ? correctAnswers.length : 1;
        const currentEnumAnswers = userAns || {};

        return (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-gray-600">List {numInputs} answer(s) below:</p>
            {[...Array(numInputs)].map((_, i) => {
              const inputVal = currentEnumAnswers[i] || '';
              const isCorrectInput = isNormalMode && isChecked && correctAnswers &&
                normalizeAnswer(correctAnswers).includes(normalizeAnswer(inputVal));

              const inputClass = `w-full p-4 border-2 rounded-xl text-lg transition-all duration-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
                isNormalMode && isChecked
                  ? (isCorrectInput ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white')
                  : 'border-gray-300'
              }`;

              return (
                <input
                  key={i}
                  type="text"
                  placeholder={`Answer ${i + 1}`}
                  value={inputVal}
                  onChange={(e) => handleUserAnswerChange(e, i)}
                  disabled={isNormalMode && isChecked}
                  className={inputClass}
                />
              );
            })}
          </div>
        );

      default:
        return <p className="text-red-500">Unsupported card type: {currentCard.Type}</p>;
    }
  };

  const renderCorrectAnswer = () => {
    let answerText = Array.isArray(currentCard["Correct Answer"])
      ? currentCard["Correct Answer"].join(' • ')
      : currentCard["Correct Answer"];

    // Format for display
    answerText = answerText.replace(/'/g, ''); // Clean up quotes
    answerText = answerText.charAt(0).toUpperCase() + answerText.slice(1);

    return (
      <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-inner mt-6">
        <p className="text-sm font-semibold text-green-700 uppercase">Correct Answer</p>
        <p className="text-2xl font-bold text-green-900 mt-2">{answerText}</p>
      </div>
    );
  };

  const renderQuizResult = () => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg p-8 text-center bg-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-extrabold text-indigo-600 mb-4">Quiz Complete!</h2>
        <motion.div
          initial={{ rotate: -10, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="text-8xl font-black mb-6 text-green-600"
        >
          {quizScore}/{totalCards}
        </motion.div>
        <p className="text-xl text-gray-700 mb-8">
          You scored **{((quizScore / totalCards) * 100).toFixed(0)}%**!
        </p>

        <button
          onClick={() => window.location.reload()} // Simple restart, could be a better route transition
          className="w-full p-4 bg-indigo-600 text-white font-bold rounded-xl text-lg hover:bg-indigo-700 transition-colors"
        >
          Review or Start New Game
        </button>
      </div>
    </motion.div>
  );

  // --- Main Render ---

  if (loading) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center p-4">
        <AnimatedGradientBackground />
        <FunLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
        <div className="p-6 bg-white rounded-xl shadow-lg text-red-700">
          <h2 className="text-xl font-bold">Error Loading Flashcards</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (showModal) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center p-4">
        <AnimatedGradientBackground />
        <ModeSelectionModal onSelectMode={handleSelectMode} />
      </div>
    );
  }

  if (showCountdown) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center">
        <AnimatedGradientBackground />
        <AnimatePresence>
          <Countdown onComplete={() => setShowCountdown(false)} />
        </AnimatePresence>
      </div>
    );
  }

  if (quizScore !== null) {
    return renderQuizResult();
  }

  if (totalCards === 0) {
      return (
        <div className="animated-bg min-h-screen flex items-center justify-center p-4">
            <AnimatedGradientBackground />
            <div className="p-6 bg-white rounded-xl shadow-lg text-gray-700">
                <h2 className="text-xl font-bold">No Cards Found</h2>
                <p>The loaded file contained no flashcards.</p>
            </div>
        </div>
    );
  }

  const isNormalMode = mode?.includes('normal');
  const isChecked = cardData.checked;
  // NEW: Get per-card flip state
  const isFlipped = cardData.isFlipped || false; 

  return (
    <div className="animated-bg min-h-screen flex flex-col items-center p-4 overflow-hidden relative">
      <AnimatedGradientBackground />

      {/* Header (Non-Navbar) */}
      <div className="w-full max-w-4xl flex justify-between items-center py-4 relative z-20">
        <button
          onClick={() => setShowModal(true)} // Or navigate back to file list
          className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {/* Center: Title/Logo */}
        <div className="flex items-center space-x-2">
          <img className='w-10 h-10' src="/icon.png" alt="QuickRev Icon" />
          <span className="text-xl font-extrabold text-white tracking-tight">
            QuickRev
          </span>
        </div>
        <div className="w-12 h-12"></div> {/* Spacer */}
      </div>

      {/* Card Counter */}
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg font-semibold text-white/90 drop-shadow-sm mb-4 z-10"
      >
        Card {currentCardIndex + 1} / {totalCards}
      </motion.p>

      {/* Flashcard Area and Navigation */}
      <div className="flex items-center justify-center w-full max-w-lg flex-grow relative z-10">

        {/* Previous Card Button */}
        <button
          onClick={() => handleNavigation(-1)}
          disabled={currentCardIndex === 0}
          className="p-3 sm:p-4 bg-white/50 backdrop-blur-sm text-indigo-800 rounded-full shadow-lg absolute left-0 sm:-left-12 disabled:opacity-30 disabled:pointer-events-none transition-all z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Card Stack / AnimatePresence */}
        <div className="w-full h-full relative flex items-center justify-center max-h-[80vh] min-h-[400px]">
          <AnimatePresence initial={false} custom={currentCardIndex}>
            {allCards.map((card, index) => {
              if (index >= currentCardIndex && index <= currentCardIndex + 2) {
                const isCurrent = index === currentCardIndex;
                const offset = index - currentCardIndex;

                // FIX: Get the card's flip state here, it is only defined for the current card
                const currentCardIsFlipped = isCurrent ? isFlipped : false; 
                
                return (
                  <motion.div
                    key={index}
                    // Animation variants for entering/exiting/stacking
                    initial={isCurrent ? { scale: 0.8, opacity: 0, x: 0, rotate: 0 } : false}
                    animate={isCurrent ? { scale: 1, opacity: 1, x: 0, rotate: 0 } : {}}
                    exit={{
                      x: -500, // Move left on exit
                      opacity: 0,
                      scale: 0.8,
                      transition: { duration: 0.4 },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      x: { type: "tween", duration: 0.3 }
                    }}
                    // Stacking effect for cards behind the current one
                    style={{
                      scale: 1 - offset * 0.05,
                      y: offset * 10,
                      boxShadow: offset > 0 ? `0 ${offset * 5}px 10px rgba(0, 0, 0, ${0.1 + offset * 0.05})` : '0 10px 25px rgba(0, 0, 0, 0.2)',
                    }}
                    drag={isCurrent ? "x" : false} // Use built-in drag prop
                    dragConstraints={{ left: -100, right: 100 }}
                    onDragStart={dragHandlers.onDragStart}
                    onDragEnd={dragHandlers.onDragEnd}
                    onDrag={dragHandlers.onDrag}
                    className={`absolute w-full h-full p-6 sm:p-8 rounded-3xl backface-hidden transition-all duration-300 ${isCurrent ? 'z-10' : 'z-0'} `}
                  >
                    {/* Card Container for Flip */}
                    <motion.div
                      className={`relative w-full h-full rounded-lg shadow-xl transition-transform duration-700 preserve-3d ${isCurrent ? 'cursor-grab' : 'cursor-default'}`}
                      // FIX: Use the card's specific flip state
                      animate={{ rotateY: currentCardIsFlipped ? 180 : 0 }} 
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Card Front (Question) */}
                      <div className="absolute inset-0 bg-white rounded-3xl p-6 sm:p-10 flex flex-col justify-between overflow-y-auto card-face backface-hidden">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                          {card.Question}
                        </h3>
                        <div className="flex-grow">
                          {/* Only render the input for the current card */}
                          {isCurrent && renderInputArea()} 
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-500 text-right">
                          Type: {card.Type}
                        </p>
                      </div>

                      {/* Card Back (Answer) - Only visible on flip */}
                      <div className="absolute inset-0 bg-white rounded-3xl p-6 sm:p-10 flex flex-col justify-center items-center overflow-y-auto card-face rotate-y-180 backface-hidden">
                        <p className="text-xl font-light text-gray-600 mb-4">The answer is...</p>
                        {/* Only render the correct answer for the current card */}
                        {isCurrent && renderCorrectAnswer()} 
                        <p className="mt-6 text-sm text-gray-400">
                          {isNormalMode ? "Flip back to continue." : "Quiz mode does not allow flipping."}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              }
              return null;
            })}
          </AnimatePresence>
        </div>

        {/* Next Card Button */}
        <button
          onClick={() => handleNavigation(1)}
          disabled={currentCardIndex === totalCards || isSwiping}
          className="p-3 sm:p-4 bg-white/50 backdrop-blur-sm text-indigo-800 rounded-full shadow-lg absolute right-0 sm:-right-12 disabled:opacity-30 disabled:pointer-events-none transition-all z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons (Only in Normal Mode) */}
      <AnimatePresence>
        {isNormalMode && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-lg flex justify-center space-x-4 mt-8 mb-4 z-10"
          >
            <button
              onClick={handleCheckAnswer}
              disabled={isChecked || isFlipped} // Cannot check if already checked or flipped to answer
              className={`flex items-center justify-center p-3 sm:p-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg w-1/2 ${
                isChecked
                  ? (cardData.isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-70`}
            >
              {isChecked ? (cardData.isCorrect ? <Check className="w-6 h-6 mr-2" /> : <X className="w-6 h-6 mr-2" />) : <Check className="w-6 h-6 mr-2" />}
              {isChecked ? (cardData.isCorrect ? 'Correct!' : 'Incorrect') : 'Check Answer'}
            </button>

            <button
              onClick={handleFlipCard}
              className="flex items-center justify-center p-3 sm:p-4 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors shadow-lg w-1/2"
            >
              <RefreshCw className="w-6 h-6 mr-2" />
              {isFlipped ? 'Flip to Question' : 'Flip to Answer'}
            </button>
          </motion.div>
        )}
        {/* Navigation for Quiz Mode (Next Button) */}
        {!isNormalMode && (
            <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg mt-8 mb-4 z-10"
          >
              <button
              onClick={() => handleNavigation(1)}
              // The next button is enabled as long as the user is not past the total card count.
              // We rely on the internal logic in handleNavigation to "check" the answer on move.
              disabled={currentCardIndex > totalCards} 
              className={`w-full p-4 text-white font-bold rounded-xl transition-colors shadow-lg ${
                currentCardIndex === totalCards - 1 ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {currentCardIndex === totalCards - 1 ? 'Finish Quiz & View Score' : 'Save Answer & Next'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* CSS for the 3D flip effect and backface hiding */
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        /* Mobile-friendly adjustments for smaller screens */
        @media (max-width: 640px) {
            .sm:-left-12 {
                left: -4px !important; /* Move navigation closer to the card edge */
            }
            .sm:-right-12 {
                right: -4px !important;
            }
            .card-face {
                padding: 1.5rem; /* Equivalent to p-6 */
            }
        }
      `}</style>
    </div>
  );
};

export default FlashcardsViewer;
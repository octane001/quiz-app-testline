function formatMathExpression(text) {
  if (!text) return "";

  return text
    .replace(
      /(\d+)\s*[′']\s*([ATCGU]+)\s*(\d+)\s*[′']/g,
      '<span class="font-mono bg-gray-100 px-1 rounded">$1′$2$3′</span>'
    )
    .replace(/(\d+)\s*[′']/g, '<span class="font-mono">$1<sup>′</sup></span>');
}

function formatDNASequence(sequence) {
  return `<span class="font-mono bg-blue-50 px-1 rounded">${sequence}</span>`;
}

function formatExplanation(explanation) {
  if (!explanation) return "";

  let formattedText = explanation

    .replace(/\b([ATCGU]+)\b(?!\d*[′'])/g, (match) => formatDNASequence(match))

    .replace(/(\d+[′'][ATCGU]+\d+[′'])/g, (match) =>
      formatMathExpression(match)
    )

    .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold">$1</span>')

    .replace(/([′'])/g, "<sup>′</sup>")

    .replace(
      /^(\d+\.)([^\n]*)/gm,
      '<div class="flex gap-2"><span class="font-semibold">$1</span>$2</div>'
    )

    .replace(/\n/g, '</p><p class="mt-2">');

  return `<div class="space-y-2">${formattedText}</div>`;
}

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer = 0;
let timerInterval;
let questionStartTime;
let userAnswers = [];
let quizData = null;
let maxStreak = 0;
let currentStreak = 0;

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options");
const progressBar = document.getElementById("progress-bar");
const questionNumber = document.getElementById("question-number");
const scoreElement = document.getElementById("current-score");
const timerElement = document.getElementById("timer");
const startButton = document.getElementById("start-quiz");

function initializeQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  maxStreak = 0;
  currentStreak = 0;
  clearInterval(timerInterval);
}

startButton.addEventListener("click", async function startQuiz() {
  try {
    initializeQuiz();
    startScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    questionText.textContent = "Loading questions...";
    optionsContainer.innerHTML =
      '<div class="text-center">Please wait...</div>';

    const response = await fetch(
      "https://api.allorigins.win/get?url=" +
        encodeURIComponent("https://api.jsonserve.com/Uw5CrX")
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (!data.contents) {
      throw new Error("Invalid data format");
    }

    quizData = JSON.parse(data.contents);

    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error("No questions found in the data");
    }

    questions = quizData.questions;
    showQuestion();
    startTimer();
  } catch (error) {
    console.error("Error fetching data:", error);
    questionText.textContent = "Error loading quiz data. Please try again.";
    optionsContainer.innerHTML = `
            <button onclick="location.reload()" 
                    class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                Retry
            </button>`;
  }
});

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    showResults();
    return;
  }

  const question = questions[currentQuestionIndex];
  questionText.textContent = question.description;
  questionNumber.textContent = `Question ${currentQuestionIndex + 1}/${
    questions.length
  }`;
  progressBar.style.width = `${
    ((currentQuestionIndex + 1) / questions.length) * 100
  }%`;

  optionsContainer.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className =
      "option-button w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors mb-2";
    button.textContent = option.description;
    button.addEventListener("click", () =>
      selectAnswer(option.is_correct, index, question)
    );
    optionsContainer.appendChild(button);
  });

  questionStartTime = Date.now();
}

function selectAnswer(isCorrect, selectedIndex, question) {
  if (optionsContainer.querySelector(".disabled")) {
    return;
  }

  const options = optionsContainer.children;
  const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

  Array.from(options).forEach((button) => {
    button.classList.add("disabled");
  });

  if (isCorrect) {
    currentStreak++;
    maxStreak = Math.max(maxStreak, currentStreak);
    score += 4;
  } else {
    currentStreak = 0;
    score = Math.max(0, score - 1); // Prevent negative scores
  }

  scoreElement.textContent = score;

  if (isCorrect) {
    options[selectedIndex].classList.add("bg-green-100");
    options[selectedIndex].classList.add("border-green-500");
  } else {
    options[selectedIndex].classList.add("bg-red-100");
    options[selectedIndex].classList.add("border-red-500");
  }

  question.options.forEach((option, index) => {
    if (option.is_correct) {
      options[index].classList.add("bg-green-100");
      options[index].classList.add("border-green-500");
    }
  });

  userAnswers.push({
    question: question.description,
    selectedAnswer: question.options[selectedIndex].description,
    correctAnswer: question.options.find((opt) => opt.is_correct).description,
    isCorrect,
    timeSpent,
    explanation: question.detailed_solution,
  });

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      showQuestion();
    } else {
      showResults();
    }
  }, 800);
}

function startTimer() {
  timer = 900;
  updateTimerDisplay();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      clearInterval(timerInterval);
      showResults();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  timerElement.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatExplanation(explanation) {
  if (!explanation) return "";

  const formattedText = explanation
    .replace(
      /\*\*\*(.*?)\*\*\*/g,
      '<span class="font-semibold text-blue-600">$1</span>'
    )
    .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold">$1</span>')
    .replace(/\n/g, "<br>");

  return formattedText;
}

function showResults() {
  clearInterval(timerInterval);
  quizScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");

  const correctCount = userAnswers.filter((answer) => answer.isCorrect).length;
  const totalSeconds = 900 - timer;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  document.getElementById("final-score").textContent = score;
  document.getElementById(
    "correct-count"
  ).textContent = `${correctCount}/${questions.length}`;
  document.getElementById("accuracy").textContent = `${
    questions.length ? Math.round((correctCount / questions.length) * 100) : 0
  }%`;
  document.getElementById("time-taken").textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
  document.getElementById("max-streak").textContent = maxStreak;

  const reviewContainer = document.getElementById("answers-review");
  reviewContainer.classList.add("hidden");

  reviewContainer.innerHTML = "";

  userAnswers.forEach((answer, index) => {
    const reviewItem = document.createElement("div");
    reviewItem.className = `p-6 rounded-lg ${
      answer.isCorrect ? "bg-green-50" : "bg-red-50"
    } mb-4`;

    reviewItem.innerHTML = `
            <div class="space-y-4">
                <!-- Question -->
                <div class="font-semibold text-lg border-b border-gray-200 pb-2">
                    ${index + 1}. ${answer.question}
                </div>
                
                <!-- Answers Section -->
                <div class="grid grid-cols-1 gap-2 ml-4">
                    <div class="flex items-start gap-2">
                        <span class="font-medium text-gray-700 min-w-[100px]">Your answer:</span>
                        <span class="text-gray-800">${
                          answer.selectedAnswer
                        }</span>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="font-medium text-gray-700 min-w-[100px]">Correct answer:</span>
                        <span class="text-gray-800">${
                          answer.correctAnswer
                        }</span>
                    </div>
                    
                    <div class="mt-2">
                        <span class="inline-flex items-center px-3 py-1 rounded-full ${
                          answer.isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        } text-sm font-medium">
                            ${
                              answer.isCorrect
                                ? "✅ Correct (+4)"
                                : "❌ Incorrect (-1)"
                            }
                        </span>
                    </div>
                </div>

                ${
                  answer.explanation
                    ? `
                    <!-- Explanation Section -->
                    <div class="mt-4 bg-white rounded-lg p-4">
                        <div class="prose prose-sm max-w-none">
                            ${formatExplanation(answer.explanation)}
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
        `;

    reviewContainer.appendChild(reviewItem);
  });

  const showAnswersButton = document.getElementById("show-answers");
  showAnswersButton.textContent = "Show Answers";
}

function restartQuiz() {
  const reviewContainer = document.getElementById("answers-review");
  reviewContainer.classList.add("hidden");

  const showAnswersButton = document.getElementById("show-answers");
  showAnswersButton.textContent = "Show Answers";

  initializeQuiz();
  resultsScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

document.getElementById("show-answers").addEventListener("click", function () {
  const reviewContainer = document.getElementById("answers-review");
  reviewContainer.classList.toggle("hidden");
  this.textContent = reviewContainer.classList.contains("hidden")
    ? "Show Answers"
    : "Hide Answers";
});

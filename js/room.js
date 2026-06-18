// js/room.js

let clientRoom = null;
let clientParticipant = null;
let clientQuestions = [];
let userAnswers = {}; // { questionId: selectedOption }
let currentQuestionIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  const roomCode = localStorage.getItem('client_room_code');
  const participantName = localStorage.getItem('client_participant_name');

  if (!roomCode || !participantName) {
    alert("Informasi room atau nama tidak ditemukan! Kembali ke Portal.");
    window.location.href = 'index.html';
    return;
  }

  // Check URL query parameters to prefill or override if needed
  const params = new URLSearchParams(window.location.search);
  const paramRoom = params.get('room');
  if (paramRoom && paramRoom !== roomCode) {
    // Override if url has a different room parameter
    localStorage.setItem('client_room_code', paramRoom.toUpperCase());
    window.location.reload();
    return;
  }

  initializeClientSession(roomCode, participantName);
});

async function initializeClientSession(roomCode, name) {
  // 1. Fetch Room details
  const { data: room, error } = await window.supabaseClient
    .from('quiz_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single();

  if (error || !room) {
    alert("Room tidak ditemukan!");
    window.location.href = 'index.html';
    return;
  }

  clientRoom = room;
  document.getElementById('client-wait-quiz-title').textContent = room.quiz_name;
  document.getElementById('client-wait-room-code').textContent = room.room_code;

  // Check if room is already On Progress or Finished
  if (room.status === 'Finished') {
    alert("Kuis sudah selesai!");
    window.location.href = 'index.html';
    return;
  }

  // 2. Insert participant; if already exists, fetch existing record with fallback logic
  let participant = null;
  let joinError = null;
  try {
    const { data, error } = await window.supabaseClient
      .from('participants')
      .insert([
        { room_id: room.id, participant_name: name, join_time: new Date() }
      ], { returning: 'representation' })
      .single();
    participant = data;
    joinError = error;
  } catch (e) {
    // If insert fails due to conflict (HTTP 409), fetch existing participant
    console.warn('Insert participant failed, attempting fetch:', e);
    const { data, error } = await window.supabaseClient
      .from('participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('participant_name', name)
      .single();
    participant = data;
    joinError = error;
  }
  if (joinError) {
    console.error('Participant registration error:', joinError);
  }
  clientParticipant = participant;
  console.log('Registered participant:', participant);

  // 3. Render participants in waiting room
  updateWaitingParticipants();

  // 4. Subscribe to participants updates
  window.RealtimeManager.subscribeToWaitingRoom(room.id, updateWaitingParticipants);

  // 5. Subscribe to Room state changes (Start Quiz trigger)
  window.RealtimeManager.subscribeToRoomState(roomCode, (updatedRoom) => {
    if (updatedRoom.status === 'On Progress') {
      startActiveQuiz();
    } else if (updatedRoom.status === 'Finished') {
      // Auto submit if host ends quiz early
      submitQuizAnswers(true);
    }
  });

  // If host already started the quiz prior to loading
  if (room.status === 'On Progress') {
    startActiveQuiz();
  }
}

async function updateWaitingParticipants() {
  if (!clientRoom) return;

  const { data: participants, error } = await window.supabaseClient
    .from('participants')
    .select('*')
    .eq('room_id', clientRoom.id);

  if (error) return;

  const list = document.getElementById('client-waiting-participants-list');
  list.innerHTML = '';
  participants.forEach(p => {
    const li = document.createElement('li');
    li.className = 'glass-panel p-2 flex items-center bg-opacity-20 border-gray-800 text-xs';
    li.innerHTML = `<span class="font-semibold text-gray-300">✓ ${escapeHTML(p.participant_name)}</span>`;
    list.appendChild(li);
  });
}

// Start Active Quiz view
async function startActiveQuiz() {
  if (!clientRoom) return;

  // 1. Fetch questions using room.question_ids array
  const qIds = clientRoom.question_ids;
  if (!qIds || qIds.length === 0) {
    alert("Room kuis ini tidak memiliki soal!");
    return;
  }

  const { data: questions, error } = await window.supabaseClient
    .from('questions')
    .select('*')
    .in('id', qIds);

  if (error) {
    alert("Gagal memuat soal kuis: " + error.message);
    return;
  }

  // Sort questions according to host order
  clientQuestions = questions.sort((a, b) => qIds.indexOf(a.id) - qIds.indexOf(b.id));

  // 2. Transition View
  document.getElementById('client-waiting-section').classList.add('hidden');
  document.getElementById('client-quiz-section').classList.remove('hidden');

  // 3. Initialize Timer
  window.Timer.start(clientRoom.duration_minutes * 60, handleTimerTick, handleTimerExpired);

  // 4. Render first question
  currentQuestionIndex = 0;
  renderQuestion(currentQuestionIndex);
}

function renderQuestion(index) {
  if (index < 0 || index >= clientQuestions.length) return;

  const q = clientQuestions[index];
  document.getElementById('quiz-progress-text').textContent = `Soal ${index + 1} dari ${clientQuestions.length}`;
  document.getElementById('quiz-active-title').textContent = clientRoom.quiz_name;
  document.getElementById('quiz-question-text').textContent = q.question_text;

  document.getElementById('text-opt-A').textContent = q.option_a;
  document.getElementById('text-opt-B').textContent = q.option_b;
  document.getElementById('text-opt-C').textContent = q.option_c;
  document.getElementById('text-opt-D').textContent = q.option_d;

  // Reset selected styles
  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));

  // Highlight previously selected answer if exists
  const selected = userAnswers[q.id];
  if (selected) {
    document.getElementById(`btn-opt-${selected}`).classList.add('selected');
  }

  // Handle navigation buttons
  document.getElementById('btn-prev-question').style.visibility = index === 0 ? 'hidden' : 'visible';
  
  const nextBtn = document.getElementById('btn-next-question');
  if (index === clientQuestions.length - 1) {
    nextBtn.textContent = 'Submit';
    nextBtn.className = 'btn btn-success text-sm';
  } else {
    nextBtn.textContent = 'Selanjutnya';
    nextBtn.className = 'btn btn-primary text-sm';
  }
}

function selectOption(option) {
  const q = clientQuestions[currentQuestionIndex];
  userAnswers[q.id] = option;

  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById(`btn-opt-${option}`).classList.add('selected');
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion(currentQuestionIndex);
  }
}

function nextQuestion() {
  if (currentQuestionIndex < clientQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion(currentQuestionIndex);
  } else {
    // Submit Quiz
    submitQuizAnswers(false);
  }
}

function handleTimerTick(timeStr, isLow) {
  const timerSpan = document.getElementById('quiz-timer');
  timerSpan.textContent = timeStr;
  if (isLow) {
    timerSpan.classList.add('animate-pulse');
    timerSpan.style.color = 'var(--accent-danger)';
  }
}

function handleTimerExpired() {
  alert("Waktu habis! Jawaban Anda akan dikirim secara otomatis.");
  submitQuizAnswers(true);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

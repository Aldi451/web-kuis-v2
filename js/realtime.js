// js/realtime.js

const RealtimeManager = {
  activeRoomSubscription: null,
  participantsSubscription: null,
  answersSubscription: null,

  subscribeToWaitingRoom(roomId, onParticipantJoin) {
    this.unsubscribeAll();

    // Listen to changes in the participants table for this room
    this.participantsSubscription = window.supabaseClient
      .channel('waiting-room-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Realtime change in participants:', payload);
          onParticipantJoin();
        }
      )
      .subscribe();
  },

  subscribeToActiveRoom(roomId, onAnswersUpdate, onParticipantsUpdate) {
    this.unsubscribeAll();

    // Listen to participant answers
    this.answersSubscription = window.supabaseClient
      .channel('active-quiz-answers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_answers',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Realtime new answer submitted:', payload);
          onAnswersUpdate(payload.new);
        }
      )
      .subscribe();

    // Listen to participant updates (submits, scores)
    this.participantsSubscription = window.supabaseClient
      .channel('active-quiz-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Realtime participant updated:', payload);
          onParticipantsUpdate();
        }
      )
      .subscribe();
  },

  subscribeToRoomState(roomCode, onStateChange) {
    this.unsubscribeAll();

    // Client listens to the room state changes
    this.activeRoomSubscription = window.supabaseClient
      .channel('client-room-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_rooms',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('Realtime Room state changed:', payload.new);
          onStateChange(payload.new);
        }
      )
      .subscribe();
  },

  unsubscribeAll() {
    if (this.activeRoomSubscription) {
      window.supabaseClient.removeChannel(this.activeRoomSubscription);
      this.activeRoomSubscription = null;
    }
    if (this.participantsSubscription) {
      window.supabaseClient.removeChannel(this.participantsSubscription);
      this.participantsSubscription = null;
    }
    if (this.answersSubscription) {
      window.supabaseClient.removeChannel(this.answersSubscription);
      this.answersSubscription = null;
    }
  }
};

window.RealtimeManager = RealtimeManager;

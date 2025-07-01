using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using System;

public class SessionHandler : MonoBehaviour
{
    [Header("UI References")]
    public GameObject countdownPanel;
    public Text countdownText;
    public Text sessionInfoText;

    [Header("Countdown Settings")]
    public int countdownDuration = 3;

    [Header("Game Manager Reference")]
    public GameController gameManager; // Reference to your existing GameManager

    private bool isProcessingSession = false;
    private PendingSession currentSession;

    private void Start()
    {
        // Subscribe to Firebase events
        FirebaseManager.OnPendingSessionFound += HandlePendingSession;
        FirebaseManager.OnFirebaseReady += OnFirebaseReady;

        // Hide countdown panel initially
        if (countdownPanel) countdownPanel.SetActive(false);
    }

    private void OnFirebaseReady()
    {
        Debug.Log("Firebase is ready, session handler active");
    }

    private void HandlePendingSession(PendingSession session)
    {
        // Only process one session at a time
        if (isProcessingSession)
        {
            Debug.Log("Already processing a session, ignoring new one");
            return;
        }

        Debug.Log($"Found pending session: {session.gameMode} - {session.difficulty}");

        currentSession = session;
        StartCoroutine(ProcessSession());
    }

    private IEnumerator ProcessSession()
    {
        isProcessingSession = true;

        // Show session info
        if (sessionInfoText)
        {
            sessionInfoText.text = $"Starting {currentSession.gameMode.ToUpper()} - {currentSession.difficulty.ToUpper()}";
        }

        // Remove the pending session from Firebase first
        FirebaseManager.Instance.RemovePendingSession(currentSession.sessionId);

        // Show countdown panel
        if (countdownPanel) countdownPanel.SetActive(true);

        // Start countdown
        yield return StartCoroutine(ShowCountdown());

        // Hide countdown panel
        if (countdownPanel) countdownPanel.SetActive(false);

        // Start the game with the specified mode and difficulty
        StartGame();

        isProcessingSession = false;
    }

    private IEnumerator ShowCountdown()
    {
        for (int i = countdownDuration; i > 0; i--)
        {
            if (countdownText) countdownText.text = i.ToString();

            Debug.Log($"Countdown: {i}");

            // Optional: Add sound effect or visual effect here
            yield return new WaitForSeconds(1f);
        }

        if (countdownText) countdownText.text = "GO!";
        yield return new WaitForSeconds(0.5f);
    }

    private void StartGame()
    {
        if (gameManager != null)
        {
            // Call your GameManager methods to start the game
            // Adjust these method calls based on your GameManager implementation
            gameManager.SetGameMode(currentSession.gameMode);
            gameManager.SetDifficulty(currentSession.difficulty);
            gameManager.StartGame();

            Debug.Log($"Started game: {currentSession.gameMode} - {currentSession.difficulty}");
        }
        else
        {
            Debug.LogError("GameManager reference not set!");
        }
    }

    // Call this method when the game ends to save the session data
    public void OnGameCompleted(int score, int duration)
    {
        if (currentSession != null && FirebaseManager.Instance != null)
        {
            FirebaseManager.Instance.AddCompletedSession(
                currentSession.userId,
                currentSession.gameMode,
                currentSession.difficulty,
                score,
                duration
            );
        }
    }

    private void OnDestroy()
    {
        // Unsubscribe from events
        FirebaseManager.OnPendingSessionFound -= HandlePendingSession;
        FirebaseManager.OnFirebaseReady -= OnFirebaseReady;
    }
}

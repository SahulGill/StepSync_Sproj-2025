using System.Collections;
using UnityEngine;
using Firebase;
using Firebase.Database;
using System;
using System.Collections.Generic;

public class FirebaseManager : MonoBehaviour
{
    [Header("Firebase Configuration")]
    public string apiKey = "AIzaSyAgmcx349bMdRomHEInADTaAzMMER0JRVU";
    //public string authDomain = "http://stepsync-34f05.firebaseapp.com";
    public string databaseURL = "https://stepsync-34f05-default-rtdb.asia-southeast1.firebasedatabase.app";
    public string projectId = "stepsync-34f05";
    public string storageBucket = "http://stepsync-34f05.firebasestorage.app";
    public string messagingSenderId = "829398616350";
    public string appId = "1:829398616350:web:e62f28c8043c67f822610f";

    [Header("Polling Settings")]
    public float pollingInterval = 2f; // Poll every 2 seconds

    public static FirebaseManager Instance { get; private set; }

    public FirebaseApp firebaseApp;
    public DatabaseReference databaseReference;

    public bool IsFirebaseInitialized { get; private set; }

    // Events
    public static event Action<PendingSession> OnPendingSessionFound;
    public static event Action OnFirebaseReady;

    private bool isPolling = false;
    private Coroutine pollingCoroutine;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeFirebase();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void InitializeFirebase()
    {
        var options = new Firebase.AppOptions
        {
            ApiKey = apiKey,
            //AuthDomain = authDomain,
            DatabaseUrl = new System.Uri(databaseURL),
            ProjectId = projectId,
            StorageBucket = storageBucket,
            MessageSenderId = messagingSenderId,
            AppId = appId
        };

        FirebaseApp.CheckAndFixDependenciesAsync().ContinueWith(task =>
        {
            var dependencyStatus = task.Result;
            if (dependencyStatus == DependencyStatus.Available)
            {
                firebaseApp = FirebaseApp.Create(options);
                databaseReference = FirebaseDatabase.GetInstance(firebaseApp).RootReference;

                IsFirebaseInitialized = true;
                Debug.Log("Firebase initialized successfully!");

                OnFirebaseReady?.Invoke();
                StartPolling();
            }
            else
            {
                Debug.LogError($"Could not resolve all Firebase dependencies: {dependencyStatus}");
            }
        });
    }

    public void StartPolling()
    {
        if (IsFirebaseInitialized && !isPolling)
        {
            isPolling = true;
            pollingCoroutine = StartCoroutine(PollForPendingSessions());
            Debug.Log("Started polling for pending sessions");
        }
    }

    public void StopPolling()
    {
        if (isPolling && pollingCoroutine != null)
        {
            isPolling = false;
            StopCoroutine(pollingCoroutine);
            Debug.Log("Stopped polling for pending sessions");
        }
    }

    private IEnumerator PollForPendingSessions()
    {
        while (isPolling)
        {
            CheckForPendingSessions();
            yield return new WaitForSeconds(pollingInterval);
        }
    }

    private void CheckForPendingSessions()
    {
        if (!IsFirebaseInitialized) return;

        databaseReference.Child("pendingSessions").GetValueAsync().ContinueWith(task =>
        {
            if (task.IsCompleted)
            {
                DataSnapshot snapshot = task.Result;
                if (snapshot.Exists)
                {
                    foreach (var sessionSnapshot in snapshot.Children)
                    {
                        var sessionData = sessionSnapshot.Value as Dictionary<string, object>;
                        if (sessionData != null && sessionData.ContainsKey("status"))
                        {
                            string status = sessionData["status"].ToString();
                            if (status == "pending")
                            {
                                var pendingSession = ParsePendingSession(sessionSnapshot.Key, sessionData);
                                if (pendingSession != null)
                                {
                                    OnPendingSessionFound?.Invoke(pendingSession);
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                Debug.LogError("Failed to check pending sessions: " + task.Exception);
            }
        });
    }

    private PendingSession ParsePendingSession(string sessionId, Dictionary<string, object> sessionData)
    {
        try
        {
            return new PendingSession
            {
                sessionId = sessionId,
                userId = sessionData["userId"].ToString(),
                userEmail = sessionData["userEmail"].ToString(),
                gameMode = sessionData["gameMode"].ToString(),
                difficulty = sessionData["difficulty"].ToString(),
                timestamp = Convert.ToInt64(sessionData["timestamp"])
            };
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to parse pending session: {e.Message}");
            return null;
        }
    }

    public void RemovePendingSession(string sessionId)
    {
        if (!IsFirebaseInitialized) return;

        databaseReference.Child("pendingSessions").Child(sessionId).RemoveValueAsync().ContinueWith(task =>
        {
            if (task.IsCompleted)
            {
                Debug.Log($"Removed pending session: {sessionId}");
            }
            else
            {
                Debug.LogError($"Failed to remove pending session: {task.Exception}");
            }
        });
    }

    public void AddCompletedSession(string userId, string gameMode, string difficulty, int score, int duration)
    {
        if (!IsFirebaseInitialized) return;

        var sessionData = new Dictionary<string, object>
        {
            ["gameMode"] = gameMode,
            ["difficulty"] = difficulty,
            ["score"] = score,
            ["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            ["duration"] = duration
        };

        string sessionId = databaseReference.Child("users").Child(userId).Child("sessions").Push().Key;

        databaseReference.Child("users").Child(userId).Child("sessions").Child(sessionId)
            .SetValueAsync(sessionData).ContinueWith(task =>
            {
                if (task.IsCompleted)
                {
                    Debug.Log("Session data saved successfully");
                }
                else
                {
                    Debug.LogError("Failed to save session data: " + task.Exception);
                }
            });
    }

    private void OnDestroy()
    {
        StopPolling();
    }
}

[System.Serializable]
public class PendingSession
{
    public string sessionId;
    public string userId;
    public string userEmail;
    public string gameMode;
    public string difficulty;
    public long timestamp;
}
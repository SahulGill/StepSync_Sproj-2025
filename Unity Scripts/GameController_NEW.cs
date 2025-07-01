using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public enum DifficultyLevel
{
    Easy,
    Medium,
    Hard
}

public enum GameMode
{
    Classic,
    Memory
}

public class GameController : MonoBehaviour
{
    [Header("Session Integration")]
    public SessionHandler sessionHandler;

    [Header("Game Mode Settings")]
    public GameMode currentGameMode;

    [Header("Difficulty Settings")]
    public DifficultyLevel currentDifficulty;

    [Header("Game Settings")]
    public float gameDuration = 60f;
    public float greenTileInterval = 3f;
    public float greenTileDuration = 2f;
    public int minGreenTiles = 2;
    public int maxGreenTiles = 4;

    [Header("Memory Mode Settings")]
    public float memoryGameDuration = 30f;
    public float memoryShowDuration = 5f;
    public int memoryLives = 3;

    [Header("UI Elements")]
    public TMP_Text scoreText;
    public TMP_Text timerText;
    public TMP_Text gameOverText;
    public TMP_Text difficultyText;
    public TMP_Text gameModeText;
    public TMP_Text memoryInfoText;
    public Button startButton;
    public Button restartButton;
    public Button easyButton;
    public Button mediumButton;
    public Button hardButton;
    public Button classicModeButton;
    public Button memoryModeButton;

    [Header("Arduino Communication")]
    public SerialController serialController;

    [Header("Audio")]
    public AudioSource audioSource;
    public AudioClip win_sfx;
    public AudioClip lose_sfx;
    public AudioClip wrong_step_sfx;
    public AudioClip correct_step_sfx;
    public AudioClip change_tile_sfx;

    [Header("Debug")]
    public bool enableDebugMessages = true;

    // Tile states
    public enum TileState
    {
        SafeGreen,
        Blue,
        Green,
        Red
    }

    // Difficulty-specific durations for green tiles
    private readonly Dictionary<DifficultyLevel, float> greenTileDurations = new Dictionary<DifficultyLevel, float>()
    {
        { DifficultyLevel.Easy, 3.0f },
        { DifficultyLevel.Medium, 2.0f },
        { DifficultyLevel.Hard, 1.0f }
    };

    // Grid representation
    private TileState[,] tileGrid = new TileState[2, 4];
    private bool[,] playerOnTile = new bool[2, 4];
    private List<Vector2Int> safeTiles = new List<Vector2Int>();
    private List<Vector2Int> playableTiles = new List<Vector2Int>();
    private List<Vector2Int> currentGreenTiles = new List<Vector2Int>();

    // Memory game variables
    private List<Vector2Int> memorySafeTiles = new List<Vector2Int>();
    private bool memoryShowingPath = false;
    private int memoryStepsCompleted = 0;
    private bool memoryAcceptingInput = false;
    private int memoryLivesRemaining = 3;
    private int completedPaths = 0;

    // Game state
    private float gameTimer;
    private int score = 0;
    private bool gameActive = false;
    private bool gameEnded = false;

    // Coroutines
    private Coroutine greenTileCoroutine;
    private Coroutine gameTimerCoroutine;
    private Coroutine memoryGameCoroutine;

    // Arduino communication
    private Queue<string> commandQueue = new Queue<string>();
    private float lastCommandSent = 0f;
    private const float commandInterval = 0.05f;

    


    void Start()
    {
        UpdateDifficultySettings();
        InitializeGame();
        SetupUI();
        StartCoroutine(InitializeArduinoAfterDelay());
    }

    void Update()
    {
        ProcessCommandQueue();
        HandleArduinoInput();

        if (!gameActive && !gameEnded)
        {
            for (int i = 0; i < safeTiles.Count; i++)
            {
                Vector2Int safeTile = safeTiles[i];
                if (playerOnTile[safeTile.x, safeTile.y])
                {
                    StartGame();
                    break;
                }
            }
        }

        // Debug controls
        if (Input.GetKeyDown(KeyCode.Space))
        {
            if (!gameActive && !gameEnded)
                StartGame();
        }

        if (Input.GetKeyDown(KeyCode.R))
        {
            RestartGame();
        }

        if (Input.GetKeyDown(KeyCode.Alpha1))
            ChangeDifficulty(DifficultyLevel.Easy);
        if (Input.GetKeyDown(KeyCode.Alpha2))
            ChangeDifficulty(DifficultyLevel.Medium);
        if (Input.GetKeyDown(KeyCode.Alpha3))
            ChangeDifficulty(DifficultyLevel.Hard);

        if (Input.GetKeyDown(KeyCode.C))
            ChangeGameMode(GameMode.Classic);
        if (Input.GetKeyDown(KeyCode.M))
            ChangeGameMode(GameMode.Memory);

        if (Input.GetKeyDown(KeyCode.D))
            DebugGameState();
        if (Input.GetKeyDown(KeyCode.T))
            TestAllLEDs();
    }


    public void SetGameMode(string gamemode)
    {

        if (gamemode == "btc")
        { 
            currentGameMode = GameMode.Classic;
        }

        else if (gamemode == "memory")
        {
            currentGameMode = GameMode.Memory;
        }

    }

    public void SetDifficulty(string difficulty)
    {

        if (difficulty == "easy")
        {
            currentDifficulty = DifficultyLevel.Easy;
        }

        else if (difficulty == "medium")
        {
            currentDifficulty = DifficultyLevel.Medium;
        }

        else
        {
            currentDifficulty = DifficultyLevel.Hard;
        }
    }

    IEnumerator InitializeArduinoAfterDelay()
    {
        yield return new WaitForSeconds(2f);
        if (serialController != null)
        {
            DebugLog("Initializing Arduino communication...");
            UpdateAllTileLEDs();
        }
        else
        {
            Debug.LogError("SerialController is not assigned!");
        }
    }

    void ProcessCommandQueue()
    {
        if (commandQueue.Count > 0 && Time.time - lastCommandSent >= commandInterval)
        {
            string command = commandQueue.Dequeue();
            SendCommandToArduino(command);
            lastCommandSent = Time.time;
        }
    }

    void QueueCommand(string command)
    {
        commandQueue.Enqueue(command);
        DebugLog($"Queued command: {command}");
    }

    void SendCommandToArduino(string command)
    {
        if (serialController != null)
        {
            serialController.SendSerialMessage(command);
            DebugLog($"Sent to Arduino: {command}");
        }
        else
        {
            Debug.LogWarning("SerialController is null - cannot send command: " + command);
        }
    }

    void InitializeGame()
    {
        if (currentGameMode == GameMode.Classic)
        {
            InitializeClassicGame();
        }
        else
        {
            InitializeMemoryGame();
        }

        score = 0;
        gameTimer = (currentGameMode == GameMode.Memory) ? memoryGameDuration : gameDuration;
        gameActive = false;
        gameEnded = false;
        currentGreenTiles.Clear();
        commandQueue.Clear();

        UpdateUI();
    }

    void InitializeClassicGame()
    {
        safeTiles.Clear();
        safeTiles.Add(new Vector2Int(0, 3));
        safeTiles.Add(new Vector2Int(1, 0));

        playableTiles.Clear();
        for (int row = 0; row < 2; row++)
        {
            for (int col = 0; col < 4; col++)
            {
                Vector2Int pos = new Vector2Int(row, col);
                if (!safeTiles.Contains(pos))
                {
                    playableTiles.Add(pos);
                }
            }
        }

        for (int row = 0; row < 2; row++)
        {
            for (int col = 0; col < 4; col++)
            {
                Vector2Int pos = new Vector2Int(row, col);
                if (safeTiles.Contains(pos))
                {
                    tileGrid[row, col] = TileState.SafeGreen;
                }
                else
                {
                    tileGrid[row, col] = TileState.Blue;
                }
                playerOnTile[row, col] = false;
            }
        }
    }

    void InitializeMemoryGame()
    {
        safeTiles.Clear();
        for (int row = 0; row < 2; row++)
        {
            safeTiles.Add(new Vector2Int(row, 0));
        }

        playableTiles.Clear();
        for (int row = 0; row < 2; row++)
        {
            for (int col = 1; col < 4; col++)
            {
                playableTiles.Add(new Vector2Int(row, col));
            }
        }

        for (int row = 0; row < 2; row++)
        {
            for (int col = 0; col < 4; col++)
            {
                Vector2Int pos = new Vector2Int(row, col);
                if (col == 0)
                {
                    tileGrid[row, col] = TileState.SafeGreen;
                }
                else
                {
                    tileGrid[row, col] = TileState.Red;
                }
                playerOnTile[row, col] = false;
            }
        }

        memorySafeTiles.Clear();
        memoryStepsCompleted = 0;
        memoryShowingPath = false;
        memoryAcceptingInput = false;
        memoryLivesRemaining = memoryLives;
        completedPaths = 0;

        CreateMemoryPath();
    }

    void CreateMemoryPath()
    {
        memorySafeTiles.Clear();
        for (int col = 1; col < 4; col++)
        {
            int randomRow = Random.Range(0, 2);
            memorySafeTiles.Add(new Vector2Int(randomRow, col));
        }

        DebugLog($"Generated memory safe path with {memorySafeTiles.Count} tiles:");
        for (int i = 0; i < memorySafeTiles.Count; i++)
        {
            DebugLog($"Safe tile[{i}]: ({memorySafeTiles[i].x}, {memorySafeTiles[i].y})");
        }
    }

    void SetupUI()
    {
        if (startButton != null)
            startButton.onClick.AddListener(StartGame);
        if (restartButton != null)
            restartButton.onClick.AddListener(RestartGame);
        if (easyButton != null)
            easyButton.onClick.AddListener(() => ChangeDifficulty(DifficultyLevel.Easy));
        if (mediumButton != null)
            mediumButton.onClick.AddListener(() => ChangeDifficulty(DifficultyLevel.Medium));
        if (hardButton != null)
            hardButton.onClick.AddListener(() => ChangeDifficulty(DifficultyLevel.Hard));
        if (classicModeButton != null)
            classicModeButton.onClick.AddListener(() => ChangeGameMode(GameMode.Classic));
        if (memoryModeButton != null)
            memoryModeButton.onClick.AddListener(() => ChangeGameMode(GameMode.Memory));

        if (gameOverText != null)
            gameOverText.gameObject.SetActive(false);

        UpdateDifficultyUI();
        UpdateGameModeUI();
    }

    public void StartGame()
    {
        if (gameEnded || gameActive) return;

        gameActive = true;

        if (startButton != null)
            startButton.gameObject.SetActive(false);

        if (currentGameMode == GameMode.Classic)
        {
            StartClassicGame();
        }
        else
        {
            StartMemoryGame();
        }

        DebugLog($"Game Started in {currentGameMode} mode!");
    }

    void StartClassicGame()
    {
        if (greenTileCoroutine != null)
            StopCoroutine(greenTileCoroutine);
        greenTileCoroutine = StartCoroutine(GreenTileSpawner());

        if (gameTimerCoroutine != null)
            StopCoroutine(gameTimerCoroutine);
        gameTimerCoroutine = StartCoroutine(GameTimer());
    }

    void StartMemoryGame()
    {
        memoryShowingPath = true;

        foreach (Vector2Int safeTile in memorySafeTiles)
        {
            tileGrid[safeTile.x, safeTile.y] = TileState.Green;
            SetTileLED(safeTile.x, safeTile.y, TileState.Green);
        }

        if (memoryGameCoroutine != null)
            StopCoroutine(memoryGameCoroutine);
        memoryGameCoroutine = StartCoroutine(RunMemorySequence());

        if (gameTimerCoroutine != null)
            StopCoroutine(gameTimerCoroutine);
        gameTimerCoroutine = StartCoroutine(GameTimer());
    }

    IEnumerator RunMemorySequence()
    {
        yield return new WaitForSeconds(memoryShowDuration);

        for (int row = 0; row < 2; row++)
        {
            for (int col = 1; col < 4; col++)
            {
                tileGrid[row, col] = TileState.Red;
                SetTileLED(row, col, TileState.Red);
            }
        }

        for (int row = 0; row < 2; row++)
        {
            tileGrid[row, 0] = TileState.SafeGreen;
            SetTileLED(row, 0, TileState.SafeGreen);
        }

        memoryShowingPath = false;
        memoryAcceptingInput = true;

        DebugLog("Memory path hidden - game started! Step on the correct tiles.");
    }

    void HandleArduinoInput()
    {
        if (serialController == null) return;

        string message = serialController.ReadSerialMessage();
        if (string.IsNullOrEmpty(message)) return;

        message = message.Trim();
        DebugLog($"Received from Arduino: '{message}'");

        if (message.StartsWith("ACK_"))
        {
            DebugLog($"Arduino acknowledged: {message}");
            return;
        }

        string[] parts = message.Split('_');
        if (parts.Length >= 4 && parts[0] == "TILE")
        {
            if (int.TryParse(parts[1], out int row) && int.TryParse(parts[2], out int col))
            {
                if (row >= 0 && row < 2 && col >= 0 && col < 4)
                {
                    if (parts[3] == "PRESSED")
                    {
                        DebugLog($"Tile pressed: ({row}, {col})");
                        OnTilePressed(row, col);
                    }
                    else if (parts[3] == "RELEASED")
                    {
                        DebugLog($"Tile released: ({row}, {col})");
                        OnTileReleased(row, col);
                    }
                }
            }
        }
    }

    void OnTilePressed(int row, int col)
    {
        playerOnTile[row, col] = true;
        Vector2Int tilePos = new Vector2Int(row, col);
        TileState currentState = tileGrid[row, col];

        if (!gameActive && !gameEnded && currentState == TileState.SafeGreen)
        {
            StartGame();
            return;
        }

        if (!gameActive || gameEnded) return;

        if (currentGameMode == GameMode.Classic)
        {
            HandleClassicTilePress(tilePos, currentState);
        }
        else
        {
            HandleMemoryTilePress(tilePos, currentState);
        }
    }

    void HandleClassicTilePress(Vector2Int tilePos, TileState currentState)
    {
        switch (currentState)
        {
            case TileState.SafeGreen:
                DebugLog($"Player stepped on safe tile ({tilePos.x}, {tilePos.y})");
                break;
            case TileState.Green:
                OnGreenTileHit(tilePos);
                break;
            case TileState.Blue:
                OnBlueTileHit(tilePos);
                break;
            case TileState.Red:
                OnRedTileHit(tilePos);
                break;
        }
    }

    void HandleMemoryTilePress(Vector2Int tilePos, TileState currentState)
    {
        if (!memoryAcceptingInput) return;

        bool isCorrectTile = memorySafeTiles.Contains(tilePos);

        if (isCorrectTile)
        {
            // Correct tile! Turn it green
            tileGrid[tilePos.x, tilePos.y] = TileState.Green;
            SetTileLED(tilePos.x, tilePos.y, TileState.Green);

            // FIXED SCORING: Increment both step counter AND overall score
            memoryStepsCompleted++;
            score++;  // Cumulative score across all paths
            audioSource.PlayOneShot(correct_step_sfx);

            DebugLog($"Correct memory tile! Current path steps: {memoryStepsCompleted}/{memorySafeTiles.Count} | Total Score: {score}");

            // Check if current path is completed
            if (memoryStepsCompleted >= memorySafeTiles.Count)
            {
                // Path completed!
                completedPaths++;

                // BONUS POINTS: Award bonus for completing a full path
                int pathCompletionBonus = 5; // 5 bonus points per completed path
                score += pathCompletionBonus;

                DebugLog($"Memory path completed! Paths: {completedPaths} | Bonus: +{pathCompletionBonus} | Total Score: {score}");

                // Generate new path and restart the sequence
                StartCoroutine(BeginNewMemoryPath());
            }

            UpdateUI();
        }
        else
        {
            audioSource.PlayOneShot(wrong_step_sfx);
            // Wrong tile! Apply difficulty-based penalty
            HandleMemoryWrongStep(tilePos);
        }
    }

    void HandleMemoryWrongStep(Vector2Int tilePos)
    {
        DebugLog($"Wrong memory tile stepped on: ({tilePos.x}, {tilePos.y})");

        switch (currentDifficulty)
        {
            case DifficultyLevel.Easy:
                // No penalty at easy level, just visual feedback
                StartCoroutine(FlashTileRed(tilePos));
                DebugLog("Wrong tile - No penalty (Easy mode)");
                break;

            case DifficultyLevel.Medium:
                // FIXED: Lose points from total score, but don't go below 0
                int mediumPenalty = 2;
                score = Mathf.Max(0, score - mediumPenalty);

                // Also step back one step in current path (but don't go below 0)
                memoryStepsCompleted = Mathf.Max(0, memoryStepsCompleted - 1);

                StartCoroutine(FlashTileRed(tilePos));
                UpdateUI();
                DebugLog($"Wrong tile - Lost {mediumPenalty} points. Current path steps: {memoryStepsCompleted}, Total Score: {score}");
                break;

            case DifficultyLevel.Hard:
                // FIXED: Major penalty - lose current path progress but keep some overall score
                int hardPenalty = 5;
                score = Mathf.Max(0, score - hardPenalty);

                // Reset current path progress
                memoryStepsCompleted = 0;

                StartCoroutine(FlashTileRed(tilePos));

                // Reset all current path tiles back to red
                foreach (Vector2Int safeTile in memorySafeTiles)
                {
                    if (tileGrid[safeTile.x, safeTile.y] == TileState.Green)
                    {
                        tileGrid[safeTile.x, safeTile.y] = TileState.Red;
                        SetTileLED(safeTile.x, safeTile.y, TileState.Red);
                    }
                }

                UpdateUI();
                DebugLog($"Wrong tile - Lost {hardPenalty} points, reset path progress. Total Score: {score}");
                break;
        }
    }

    IEnumerator BeginNewMemoryPath()
    {
        yield return new WaitForSeconds(1f);

        // FIXED: Only reset current path progress, NOT total score
        memoryStepsCompleted = 0;  // Reset steps for new path
        memoryAcceptingInput = false;
        // NOTE: We do NOT reset 'score' here - it's cumulative!

        // Generate new path
        CreateMemoryPath();

        // Reset all playable tiles to red
        for (int row = 0; row < 2; row++)
        {
            for (int col = 1; col < 4; col++)
            {
                tileGrid[row, col] = TileState.Red;
                SetTileLED(row, col, TileState.Red);
            }
        }

        // Show new path
        memoryShowingPath = true;
        foreach (Vector2Int safeTile in memorySafeTiles)
        {
            tileGrid[safeTile.x, safeTile.y] = TileState.Green;
            SetTileLED(safeTile.x, safeTile.y, TileState.Green);
        }

        StartCoroutine(RunMemorySequence());
    }

    void OnTileReleased(int row, int col)
    {
        playerOnTile[row, col] = false;
    }

    void OnGreenTileHit(Vector2Int tilePos)
    {
        score++;
        audioSource.PlayOneShot(correct_step_sfx);
        tileGrid[tilePos.x, tilePos.y] = TileState.Blue;
        currentGreenTiles.Remove(tilePos);
        SetTileLED(tilePos.x, tilePos.y, TileState.Blue);
        UpdateUI();
        DebugLog($"Green tile hit! Score: {score}");
    }

    void OnBlueTileHit(Vector2Int tilePos)
    {
        audioSource.PlayOneShot(wrong_step_sfx);
        tileGrid[tilePos.x, tilePos.y] = TileState.Red;
        SetTileLED(tilePos.x, tilePos.y, TileState.Red);
        DebugLog($"Blue tile hit - now red obstacle ({tilePos.x}, {tilePos.y})");
        CheckGameEndCondition();
    }

    void OnRedTileHit(Vector2Int tilePos)
    {
        DebugLog($"Player stepped on red tile at ({tilePos.x}, {tilePos.y})");

        switch (currentDifficulty)
        {
            case DifficultyLevel.Easy:
                // No penalty at easy level
                DebugLog("Red tile hit - No penalty (Easy mode)");
                break;

            case DifficultyLevel.Medium:
                // FIXED: Lose 1 point but don't go below 0, and don't end game
                int previousScore = score;
                score = Mathf.Max(0, score - 1);

                UpdateUI();
                DebugLog($"Red tile hit - Lost 1 point. Score: {previousScore} → {score}");

                // REMOVED: No longer end game when score reaches 0
                // Players can continue playing even at 0 score
                break;

            case DifficultyLevel.Hard:
                // Instant game over (unchanged)
                EndGame("Stepped on red tile! (Hard mode)");
                break;
        }
    }

    IEnumerator GreenTileSpawner()
    {
        while (gameActive && !gameEnded)
        {
            yield return new WaitForSeconds(greenTileInterval);
            if (!gameActive || gameEnded) break;
            SpawnGreenTiles();
        }
    }

    void SpawnGreenTiles()
    {
        List<Vector2Int> availableTiles = new List<Vector2Int>();
        foreach (Vector2Int tile in playableTiles)
        {
            if (tileGrid[tile.x, tile.y] == TileState.Blue)
            {
                availableTiles.Add(tile);
            }
        }

        if (availableTiles.Count == 0) return;

        int tilesToSpawn = Random.Range(minGreenTiles, maxGreenTiles + 1);
        tilesToSpawn = Mathf.Min(tilesToSpawn, availableTiles.Count);

        for (int i = 0; i < tilesToSpawn; i++)
        {
            int randomIndex = Random.Range(0, availableTiles.Count);
            Vector2Int selectedTile = availableTiles[randomIndex];
            availableTiles.RemoveAt(randomIndex);

            tileGrid[selectedTile.x, selectedTile.y] = TileState.Green;
            currentGreenTiles.Add(selectedTile);
            SetTileLED(selectedTile.x, selectedTile.y, TileState.Green);
            audioSource.PlayOneShot(change_tile_sfx);

            StartCoroutine(GreenTileTimer(selectedTile));
        }
    }

    IEnumerator GreenTileTimer(Vector2Int tilePos)
    {
        float duration = greenTileDurations[currentDifficulty];
        yield return new WaitForSeconds(duration);

        if (tileGrid[tilePos.x, tilePos.y] == TileState.Green)
        {
            tileGrid[tilePos.x, tilePos.y] = TileState.Blue;
            currentGreenTiles.Remove(tilePos);
            SetTileLED(tilePos.x, tilePos.y, TileState.Blue);
        }
    }

    IEnumerator GameTimer()
    {
        while (gameTimer > 0 && gameActive && !gameEnded)
        {
            yield return new WaitForSeconds(1f);
            gameTimer--;
            UpdateUI();
        }

        if (gameActive && !gameEnded)
        {
            if (currentGameMode == GameMode.Memory)
                EndGame($"Time's up! Completed {completedPaths} memory paths.");
            else
                EndGame("Time's up!");
        }
    }

    void CheckGameEndCondition()
    {
        if (currentGameMode != GameMode.Classic) return;

        bool allRed = true;
        foreach (Vector2Int tile in playableTiles)
        {
            if (tileGrid[tile.x, tile.y] != TileState.Red)
            {
                allRed = false;
                break;
            }
        }

        if (allRed)
            EndGame("All tiles are obstacles! Game Over!");
    }

    IEnumerator FlashTileRed(Vector2Int tilePos)
    {
        TileState originalState = tileGrid[tilePos.x, tilePos.y];

        tileGrid[tilePos.x, tilePos.y] = TileState.Red;
        SetTileLED(tilePos.x, tilePos.y, TileState.Red);

        yield return new WaitForSeconds(0.5f);

        tileGrid[tilePos.x, tilePos.y] = originalState;
        SetTileLED(tilePos.x, tilePos.y, originalState);
    }

    void EndGame(string reason)
    {
        gameActive = false;
        gameEnded = true;

        if (greenTileCoroutine != null)
            StopCoroutine(greenTileCoroutine);
        if (gameTimerCoroutine != null)
            StopCoroutine(gameTimerCoroutine);
        if (memoryGameCoroutine != null)
            StopCoroutine(memoryGameCoroutine);

        if (gameOverText != null)
        {
            string gameOverMessage = $"{reason}\nFinal Score: {score}";
            if (currentGameMode == GameMode.Memory)
                gameOverMessage += $"\nCompleted Paths: {completedPaths}";
            else
                gameOverMessage += $"\nDifficulty: {currentDifficulty}";
            gameOverMessage += $"\nMode: {currentGameMode}";

            gameOverText.text = gameOverMessage;
            gameOverText.gameObject.SetActive(true);
        }

        if (sessionHandler != null)
        {
            int gameDuration = Mathf.RoundToInt(Time.time - gameTimer);
            sessionHandler.OnGameCompleted(score, gameDuration);
        }

        if (startButton != null)
            startButton.gameObject.SetActive(true);

        DebugLog($"Game Ended: {reason} - Final Score: {score}");
    }

    public void RestartGame()
    {
        InitializeGame();
        if (gameOverText != null)
            gameOverText.gameObject.SetActive(false);
        StartCoroutine(DelayedLEDUpdate());
    }

    IEnumerator DelayedLEDUpdate()
    {
        yield return new WaitForSeconds(0.5f);
        UpdateAllTileLEDs();
    }

    void UpdateUI()
    {
        if (scoreText != null)
        {
            if (currentGameMode == GameMode.Memory)
            {
                // Show current path progress and total score
                scoreText.text = $"Score: {score} | Path: {memoryStepsCompleted}/{memorySafeTiles.Count}";
            }
            else
            {
                scoreText.text = "Score: " + score.ToString();
            }
        }

        if (timerText != null)
        {
            timerText.text = "Time: " + Mathf.Ceil(gameTimer).ToString();
        }

        if (memoryInfoText != null)
        {
            if (currentGameMode == GameMode.Memory)
            {
                string status = memoryShowingPath ? "MEMORIZE PATH" : "STEP ON CORRECT TILES";
                memoryInfoText.text = $"{status}\nCompleted Paths: {completedPaths}\nTotal Score: {score}";
                memoryInfoText.gameObject.SetActive(true);
            }
            else
            {
                memoryInfoText.gameObject.SetActive(false);
            }
        }
    }

    void UpdateDifficultyUI()
    {
        if (difficultyText != null)
        {
            if (currentGameMode == GameMode.Classic)
            {
                difficultyText.text = $"Difficulty: {currentDifficulty}\nGreen Duration: {greenTileDurations[currentDifficulty]}s";
                difficultyText.gameObject.SetActive(true);
            }
            else
            {
                difficultyText.gameObject.SetActive(false);
            }
        }
    }

    void UpdateGameModeUI()
    {
        if (gameModeText != null)
            gameModeText.text = $"Mode: {currentGameMode}";

        if (classicModeButton != null)
            classicModeButton.interactable = (currentGameMode != GameMode.Classic);
        if (memoryModeButton != null)
            memoryModeButton.interactable = (currentGameMode != GameMode.Memory);

        bool showDifficultyButtons = (currentGameMode == GameMode.Classic);
        if (easyButton != null) easyButton.gameObject.SetActive(showDifficultyButtons);
        if (mediumButton != null) mediumButton.gameObject.SetActive(showDifficultyButtons);
        if (hardButton != null) hardButton.gameObject.SetActive(showDifficultyButtons);

        UpdateDifficultyUI();
    }

    void UpdateAllTileLEDs()
    {
        for (int row = 0; row < 2; row++)
        {
            for (int col = 0; col < 4; col++)
            {
                SetTileLED(row, col, tileGrid[row, col]);
            }
        }
    }

    void SetTileLED(int row, int col, TileState state)
    {
        if (serialController == null)
        {
            Debug.LogWarning("SerialController is null - cannot set LED");
            return;
        }

        int tileIndex = row * 4 + col;
        string colorCommand = "";

        switch (state)
        {
            case TileState.SafeGreen:
            case TileState.Green:
                colorCommand = "GREEN";
                break;
            case TileState.Blue:
                colorCommand = "BLUE";
                break;
            case TileState.Red:
                colorCommand = "RED";
                break;
        }

        string message = $"LED_{tileIndex}_{colorCommand}";
        QueueCommand(message);
    }

    public void ChangeGameMode(GameMode newGameMode)
    {
        if (gameActive || gameEnded)
        {
            DebugLog("Cannot change game mode while game is active. Please restart first.");
            return;
        }

        currentGameMode = newGameMode;
        InitializeGame();
        UpdateGameModeUI();
        DebugLog($"Game mode changed to: {currentGameMode}");
    }

    public void ChangeDifficulty(DifficultyLevel newDifficulty)
    {
        currentDifficulty = newDifficulty;
        UpdateDifficultySettings();
        UpdateDifficultyUI();
        DebugLog($"Difficulty changed to: {currentDifficulty}");

        if (gameActive)
        {
            DebugLog("Difficulty change will apply to new green tiles");
        }
    }

    void UpdateDifficultySettings()
    {
        greenTileDuration = greenTileDurations[currentDifficulty];
    }

    // Public methods for external control
    public void SetGameDuration(float duration)
    {
        gameDuration = duration;
    }

    public void SetMemoryGameDuration(float duration)
    {
        memoryGameDuration = duration;
    }

    public void SetMemoryShowDuration(float duration)
    {
        memoryShowDuration = duration;
    }

    public void SetMemoryLives(int lives)
    {
        memoryLives = lives;
    }

    public void SetGreenTileInterval(float interval)
    {
        greenTileInterval = interval;
    }

    public void SetGreenTileDuration(float duration)
    {
        greenTileDuration = duration;
    }

    public int GetCurrentScore()
    {
        return score;
    }

    public int GetCompletedPaths()
    {
        return completedPaths;
    }

    public int GetMemoryLivesRemaining()
    {
        return memoryLivesRemaining;
    }

    public bool IsGameActive()
    {
        return gameActive;
    }

    public float GetRemainingTime()
    {
        return gameTimer;
    }

    public DifficultyLevel GetCurrentDifficulty()
    {
        return currentDifficulty;
    }

    public GameMode GetCurrentGameMode()
    {
        return currentGameMode;
    }

    // Debug function to check game state
    void DebugGameState()
    {
        Debug.Log("=== GAME STATE DEBUG ===");
        Debug.Log($"Game Mode: {currentGameMode}");
        Debug.Log($"Difficulty: {currentDifficulty}");
        Debug.Log($"Green Tile Duration: {greenTileDurations[currentDifficulty]}s");
        Debug.Log($"Game Active: {gameActive}");
        Debug.Log($"Game Ended: {gameEnded}");
        Debug.Log($"Score: {score}");
        Debug.Log($"Timer: {gameTimer}");
        Debug.Log($"Safe Tiles Count: {safeTiles.Count}");
        Debug.Log($"Playable Tiles Count: {playableTiles.Count}");
        Debug.Log($"Current Green Tiles: {currentGreenTiles.Count}");
        Debug.Log($"Command Queue Size: {commandQueue.Count}");

        if (currentGameMode == GameMode.Memory)
        {
            Debug.Log($"=== MEMORY GAME STATE ===");
            Debug.Log($"Memory Lives Remaining: {memoryLivesRemaining}");
            Debug.Log($"Completed Paths: {completedPaths}");
            Debug.Log($"Memory Steps Completed: {memoryStepsCompleted}");
            Debug.Log($"Memory Safe Tiles Count: {memorySafeTiles.Count}");
            Debug.Log($"Showing Memory Path: {memoryShowingPath}");
            Debug.Log($"Accepting Memory Input: {memoryAcceptingInput}");

            if (memorySafeTiles.Count > 0)
            {
                Debug.Log("Current Memory Safe Path:");
                for (int i = 0; i < memorySafeTiles.Count; i++)
                {
                    Debug.Log($"  SafeTile[{i}]: ({memorySafeTiles[i].x}, {memorySafeTiles[i].y})");
                }
            }
        }

        Debug.Log("Tile States:");
        for (int row = 0; row < 2; row++)
        {
            for (int col = 0; col < 4; col++)
            {
                Debug.Log($"Tile ({row},{col}): {tileGrid[row, col]} - Player: {playerOnTile[row, col]}");
            }
        }
        Debug.Log("========================");
    }

    void DebugLog(string message)
    {
        if (enableDebugMessages)
        {
            Debug.Log(message);
        }
    }

    // Public method to manually start game (useful for debugging)
    public void ForceStartGame()
    {
        DebugLog("Force starting game...");
        StartGame();
    }

    // Test LED functionality
    public void TestAllLEDs()
    {
        DebugLog("Testing all LEDs...");
        StartCoroutine(TestLEDSequence());
    }

    IEnumerator TestLEDSequence()
    {
        QueueCommand("TEST_RED");
        yield return new WaitForSeconds(1f);

        QueueCommand("TEST_GREEN");
        yield return new WaitForSeconds(1f);

        QueueCommand("TEST_BLUE");
        yield return new WaitForSeconds(1f);

        yield return new WaitForSeconds(0.5f);
        UpdateAllTileLEDs();
    }

    // Method to test individual tile
    public void TestTile(int tileIndex, string color)
    {
        string command = $"LED_{tileIndex}_{color}";
        QueueCommand(command);
    }

    // Memory game specific debug methods
    public void DebugGenerateMemoryPath()
    {
        if (currentGameMode == GameMode.Memory)
        {
            CreateMemoryPath();
            DebugLog("Debug: Generated new memory path");
        }
    }

    public void DebugShowMemoryPath()
    {
        if (currentGameMode == GameMode.Memory && memorySafeTiles.Count > 0)
        {
            StartCoroutine(RunMemorySequence());
            DebugLog("Debug: Showing memory path");
        }
    }

    // Method to clear all commands in queue (useful for debugging)
    public void ClearCommandQueue()
    {
        commandQueue.Clear();
        DebugLog("Command queue cleared");
    }

    // Check if SerialController is assigned
    public bool HasSerialController()
    {
        return serialController != null;
    }
}
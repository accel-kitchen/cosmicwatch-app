/**
 * エラーの種類を定義
 */
export enum ErrorType {
  SERIAL_CONNECTION = "SERIAL_CONNECTION",
  FILE_OPERATION = "FILE_OPERATION",
  DATA_PARSING = "DATA_PARSING",
  PLATFORM_OPERATION = "PLATFORM_OPERATION",
  UPDATE_CHECK = "UPDATE_CHECK",
  VALIDATION = "VALIDATION",
  UNKNOWN = "UNKNOWN",
}

/**
 * エラーの重要度を定義
 */
export enum ErrorSeverity {
  LOW = "LOW", // ログのみ
  MEDIUM = "MEDIUM", // ログ + 通知
  HIGH = "HIGH", // ログ + 通知 + UI表示
  CRITICAL = "CRITICAL", // ログ + 通知 + UI表示 + 処理停止
}

/**
 * 統一されたエラー情報
 */
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  id: string;
}

/**
 * エラーハンドラーのインターフェース
 */
export interface ErrorHandler {
  (error: AppError): void;
}

/**
 * 統一されたエラーハンドリングサービス
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService | null = null;
  private handlers: Map<ErrorSeverity, ErrorHandler[]> = new Map();
  private errorHistory: AppError[] = [];
  private readonly maxHistorySize = 100;

  private constructor() {
    // 各重要度のハンドラーリストを初期化
    Object.values(ErrorSeverity).forEach((severity) => {
      this.handlers.set(severity, []);
    });

    // デフォルトハンドラーを設定
    this.setupDefaultHandlers();
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): ErrorHandlingService {
    if (!this.instance) {
      this.instance = new ErrorHandlingService();
    }
    return this.instance;
  }

  /**
   * エラーを処理する
   */
  handleError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      type,
      severity,
      message,
      originalError,
      context,
      timestamp: new Date(),
      id: this.generateErrorId(),
    };

    // エラー履歴に追加
    this.addToHistory(appError);

    // 該当する重要度のハンドラーを実行
    const handlers = this.handlers.get(severity) || [];
    handlers.forEach((handler) => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error("Error handler failed:", handlerError);
      }
    });

    return appError;
  }

  /**
   * エラーハンドラーを登録
   */
  addHandler(severity: ErrorSeverity, handler: ErrorHandler): void {
    const handlers = this.handlers.get(severity) || [];
    handlers.push(handler);
    this.handlers.set(severity, handlers);
  }

  /**
   * エラーハンドラーを削除
   */
  removeHandler(severity: ErrorSeverity, handler: ErrorHandler): void {
    const handlers = this.handlers.get(severity) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * エラー履歴を取得
   */
  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  /**
   * エラー履歴をクリア
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 特定の種類のエラーをフィルタリング
   */
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorHistory.filter((error) => error.type === type);
  }

  /**
   * 特定の重要度のエラーをフィルタリング
   */
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorHistory.filter((error) => error.severity === severity);
  }

  /**
   * デフォルトハンドラーを設定
   */
  private setupDefaultHandlers(): void {
    // LOWレベル: コンソールログのみ
    this.addHandler(ErrorSeverity.LOW, (error) => {
      console.log(`[${error.type}] ${error.message}`, error.context);
    });

    // MEDIUMレベル: 警告ログ
    this.addHandler(ErrorSeverity.MEDIUM, (error) => {
      console.warn(`[${error.type}] ${error.message}`, {
        originalError: error.originalError,
        context: error.context,
      });
    });

    // HIGHレベル: エラーログ
    this.addHandler(ErrorSeverity.HIGH, (error) => {
      console.error(`[${error.type}] ${error.message}`, {
        originalError: error.originalError,
        context: error.context,
        timestamp: error.timestamp,
      });
    });

    // CRITICALレベル: 詳細エラーログ
    this.addHandler(ErrorSeverity.CRITICAL, (error) => {
      console.error(`[CRITICAL][${error.type}] ${error.message}`, {
        originalError: error.originalError,
        context: error.context,
        timestamp: error.timestamp,
        stack: error.originalError?.stack,
      });
    });
  }

  /**
   * エラー履歴に追加
   */
  private addToHistory(error: AppError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * エラーIDを生成
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 便利な関数群
 */
export const ErrorHandler = {
  /**
   * シリアル接続エラー
   */
  serialConnection: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.SERIAL_CONNECTION,
      ErrorSeverity.HIGH,
      message,
      originalError,
      context
    );
  },

  /**
   * ファイル操作エラー
   */
  fileOperation: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.FILE_OPERATION,
      ErrorSeverity.MEDIUM,
      message,
      originalError,
      context
    );
  },

  /**
   * データパースエラー
   */
  dataParsing: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.DATA_PARSING,
      ErrorSeverity.LOW,
      message,
      originalError,
      context
    );
  },

  /**
   * プラットフォーム操作エラー
   */
  platformOperation: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.PLATFORM_OPERATION,
      ErrorSeverity.MEDIUM,
      message,
      originalError,
      context
    );
  },

  /**
   * アップデートチェックエラー
   */
  updateCheck: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.UPDATE_CHECK,
      ErrorSeverity.LOW,
      message,
      originalError,
      context
    );
  },

  /**
   * バリデーションエラー
   */
  validation: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.VALIDATION,
      ErrorSeverity.MEDIUM,
      message,
      originalError,
      context
    );
  },

  /**
   * 不明なエラー
   */
  unknown: (
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) => {
    return ErrorHandlingService.getInstance().handleError(
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      message,
      originalError,
      context
    );
  },
};

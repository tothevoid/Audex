import * as signalR from "@microsoft/signalr";
import config from "@/config";
import { getAccessToken } from "@/api/tokenStorage";

type SignalREventHandler<TPayload = unknown> = (payload: TPayload) => void | Promise<void>;

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private connectingPromise: Promise<void> | null = null;
    private readonly listeners: Map<string, Set<SignalREventHandler<never>>> = new Map();

    private getOrCreateConnection(): signalR.HubConnection {
        if (this.connection) {
            return this.connection;
        }

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${config.api.URL}/messages`, {
                accessTokenFactory: () => getAccessToken() ?? ""
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        newConnection.onreconnected((connectionId?: string) => {
            console.info("SignalR reconnected successfully. ConnectionId:", connectionId);
        });

        newConnection.onclose(() => {
            this.connectingPromise = null;
        });

        // Register any already-registered event handlers on the newly constructed connection
        for (const eventName of this.listeners.keys()) {
            this.attachHubHandler(newConnection, eventName);
        }

        this.connection = newConnection;
        return newConnection;
    }

    private attachHubHandler(connection: signalR.HubConnection, eventName: string): void {
        connection.on(eventName, (payload: unknown) => {
            this.dispatchMessage(eventName, payload);
        });
    }

    private dispatchMessage(eventName: string, payload: unknown): void {
        const eventListeners = this.listeners.get(eventName);
        if (!eventListeners || eventListeners.size === 0) {
            return;
        }

        eventListeners.forEach((listener) => {
            try {
                const result = listener(payload as never);
                if (result && typeof (result as Promise<void>).catch === "function") {
                    (result as Promise<void>).catch((error: unknown) => {
                        console.error(`Error in SignalR listener for event "${eventName}":`, error);
                    });
                }
            } catch (error: unknown) {
                console.error(`Error executing SignalR listener for event "${eventName}":`, error);
            }
        });
    }

    public async startAsync(): Promise<void> {
        const connection = this.getOrCreateConnection();

        if (connection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        if (this.connectingPromise) {
            return this.connectingPromise;
        }

        this.connectingPromise = connection
            .start()
            .then(() => {
                this.connectingPromise = null;
            })
            .catch((error: unknown) => {
                this.connectingPromise = null;
                console.error("Failed to connect to SignalR hub:", error);
            });

        return this.connectingPromise;
    }

    public async stopAsync(): Promise<void> {
        if (this.connectingPromise) {
            try {
                await this.connectingPromise;
            } catch (error: unknown) {
                console.warn("SignalR connection failed while awaiting teardown:", error);
            }
        }

        if (!this.connection) {
            return;
        }

        try {
            if (
                this.connection.state === signalR.HubConnectionState.Connected ||
                this.connection.state === signalR.HubConnectionState.Connecting
            ) {
                await this.connection.stop();
            }
        } catch (error: unknown) {
            console.error("Error stopping SignalR connection:", error);
        } finally {
            this.connection = null;
            this.connectingPromise = null;
        }
    }

    public on<TPayload = unknown>(eventName: string, handler: SignalREventHandler<TPayload>): void {
        let eventListeners = this.listeners.get(eventName);
        if (!eventListeners) {
            eventListeners = new Set();
            this.listeners.set(eventName, eventListeners);

            if (this.connection) {
                this.attachHubHandler(this.connection, eventName);
            }
        }

        eventListeners.add(handler as SignalREventHandler<never>);
    }

    public off<TPayload = unknown>(eventName: string, handler: SignalREventHandler<TPayload>): void {
        const eventListeners = this.listeners.get(eventName);
        if (!eventListeners) {
            return;
        }

        eventListeners.delete(handler as SignalREventHandler<never>);

        if (eventListeners.size === 0) {
            this.listeners.delete(eventName);
            if (this.connection) {
                this.connection.off(eventName);
            }
        }
    }

    public getConnectionState(): signalR.HubConnectionState {
        return this.connection ? this.connection.state : signalR.HubConnectionState.Disconnected;
    }
}

export const signalRService = new SignalRService();
export default signalRService;

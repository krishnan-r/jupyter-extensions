import { ReactWidget } from "@jupyterlab/apputils";
import { JSONObject, JSONValue } from "@lumino/coreutils";
import {
  ConnectionStatus,
  IComm,
  IKernelConnection,
} from "@jupyterlab/services/lib/kernel/kernel";
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { KernelMessage } from "@jupyterlab/services";

import { NotAttachedState } from "./notattached";
import { LoadingState } from "./loading";
import { ConfigurationState } from "./configuring";
import { ConnectingState } from "./connecting";
import { ConnectedState } from "./connected";
import { ConnectFailedState } from "./connectfailed";

export interface IState {
  render(): JSX.Element;
  name(): string;
}

export interface SparkOpt {
  name: string;
  value: string;
}

export interface SparkconnectMetadata {
  bundled_options: Array<string>;
  list_of_options: Array<SparkOpt>;
}

class UndefinedStates {
  loading: LoadingState<IState>;
  notattached: LoadingState<IState>;

  constructor() {
    this.notattached = new NotAttachedState();
    this.loading = new LoadingState();
  }
}

class NotebookStates {
  configuring: ConfigurationState<IState>;
  connecting: ConnectingState<IState>;
  connected: ConnectedState<IState>;
  connectfailed: ConnectFailedState<IState>;

  constructor() {
    this.configuring = new ConfigurationState();
    this.connecting = new ConnectingState();
    this.connected = new ConnectedState();
    this.connectfailed = new ConnectFailedState();
  }
}

interface NotebookComm {
  notebook: NotebookPanel;
  states: NotebookStates;
  comm: IComm;
}

class StateHandler {
  private states: Map<string, NotebookComm>;
  private notebooks: INotebookTracker;

  constructor(notebooks: INotebookTracker) {
    this.states = new Map<string, NotebookComm>();
    this.notebooks = notebooks;
  }

  /**
   * we can only communicate with 1 notebook at a time
   * @param notebookId
   */
  canOpen(notebookId: string): boolean {
    return notebookId == this.notebooks.currentWidget.id;
  }

  open(notebookId: string, openMsg: JSONValue): NotebookComm {
    let notebookComm: NotebookComm;
    notebookComm = this.states.get(notebookId);
    if (notebookComm.comm.isDisposed) {
      console.log("conn disposed " + notebookId);
      return notebookComm;
    }
    notebookComm.comm.send(openMsg).done.then(() => {
      console.log("conn restored " + notebookId);
    });
  }

  create(notebook: NotebookPanel, openMsg: JSONValue): NotebookComm {
    let kernel = notebook.sessionContext.session.kernel;

    let comm = kernel.createComm("SparkConnector");
    comm.open(openMsg).done.then(() => {
      this.states.set(notebook.id, notebookComm);
      console.log("conn opened " + notebook.title.label);
    });
    comm.onClose = () => {
      this.states.delete(notebook.id);
      console.log("conn closed " + notebook.title.label);
    };

    let states = new NotebookStates();

    let notebookComm: NotebookComm = {
      notebook: notebook,
      states: states,
      comm: comm,
    };

    return notebookComm;
  }

  has(notebookId: string): boolean {
    return this.states.has(notebookId);
  }

  close(notebookId: string): void {
    this.states.delete(notebookId);
    console.log("conn closed " + notebookId);
  }

  clear(): void {
    this.states.clear();
    console.log("conns cleared");
  }
}

/**
 * A class that exposes the git plugin Widget.
 */
export class SparkConnector extends ReactWidget {
  private statehandler: StateHandler;
  private notebooks: INotebookTracker;
  private currentState: IState;

  /**
   * Construct a console panel.
   */
  constructor(notebooks: INotebookTracker) {
    super();
    this.addClass("jp-SparkConnector");

    this.notebooks = notebooks;
    this.statehandler = new StateHandler(notebooks);

    this.initStateHandling();
  }

  updateCurrent(state: IState) {
    this.currentState = state;
    this.update();
  }

  initStateHandling(): void {
    let undefinedStates = new UndefinedStates();
    this.currentState = undefinedStates.notattached;
    this.notebooks.currentChanged.connect(
      (sender: any, nbPanel: NotebookPanel) => {
        if (!nbPanel) {
          // if not NotebookPanel has been opened
          this.updateCurrent(undefinedStates.notattached);
          return;
        }

        this.updateCurrent(undefinedStates.loading);

        nbPanel.sessionContext.ready.then(() => {
          let notebookComm: NotebookComm;
          let title = nbPanel.title.label;
          let kernel = nbPanel.sessionContext.session.kernel;

          if (this.statehandler.has(nbPanel.id)) {
            // if we already have a comm, connectionStatusChanged wont be triggered,
            // manually send sparkconn-action-open
            this.statehandler.open(nbPanel.id, {
              type: "action",
              action: "sparkconn-action-open",
            });
          } else if (kernel.connectionStatus == "connected") {
            // if we do not have comm and kernel connected, connectionStatusChanged wont be triggered
            // and e need to reconnect
            console.log("notebook reconnecting " + title);
            kernel.reconnect().then();
          }

          kernel.connectionStatusChanged.connect(
            (conn: IKernelConnection, status: ConnectionStatus) => {
              if (status == "connected") {
                console.log("notebook connected " + title);
                notebookComm = this.statehandler.create(nbPanel, {
                  type: "action",
                  action: "sparkconn-action-open",
                });
                notebookComm.comm.onMsg = (msg: KernelMessage.ICommMsgMsg) => {
                  if (
                    this.notebooks.currentWidget == null ||
                    this.notebooks.currentWidget.id != nbPanel.id
                  ) {
                    return;
                  }

                  if (msg.content.data.msgtype == "sparkconn-action-open") {
                    if (msg.content.data.page == "sparkconn-config") {
                      let currentConfig;
                      if (nbPanel.model.metadata.has("sparkconnect")) {
                        currentConfig = (nbPanel.model.metadata.get(
                          "sparkconnect"
                        ) as unknown) as SparkconnectMetadata;
                      } else {
                        currentConfig = {
                          bundled_options: [],
                          list_of_options: [],
                        } as SparkconnectMetadata;
                      }
                      console.log(
                        title +
                          " config-msg=" +
                          JSON.stringify(msg.content.data) +
                          " received"
                      );
                      console.log(
                        title + " meta=" + JSON.stringify(currentConfig)
                      );
                      notebookComm.states.configuring.init(
                        title,
                        msg.content.data.maxmemory as string,
                        msg.content.data.sparkversion as string,
                        msg.content.data.cluster as string,
                        currentConfig,
                        msg.content.data.availableoptions as JSONObject,
                        msg.content.data.availablebundles as JSONObject
                      );
                      notebookComm.states.configuring.onConnect.connect(
                        (
                          configuring: ConfigurationState<IState>,
                          message: JSONObject
                        ) => {
                          // Connect button clicked
                          notebookComm.states.connecting.init(
                            title,
                            msg.content.data.sparkversion as string,
                            msg.content.data.cluster as string
                          );
                          this.updateCurrent(notebookComm.states.connecting);
                          nbPanel.model.metadata.set(
                            "sparkconnect",
                            message["metadata"]
                          );
                          notebookComm.comm.send({
                            type: "action",
                            action: "sparkconn-action-connect",
                            "action-data": { options: message["options"] },
                          });
                        }
                      );
                      this.updateCurrent(notebookComm.states.configuring);
                    } else {
                      console.log(
                        title +
                          " connected-msg=" +
                          JSON.stringify(msg.content.data) +
                          " received"
                      );
                      notebookComm.states.connected.init(
                        title,
                        msg.content.data.sparkversion as string,
                        msg.content.data.cluster as string,
                        msg.content.data.session as JSONObject
                      );
                      //when the sparkconnector goes into connected state,
                      //kernel restarts are the equivalent of a reload of the entire connection
                      kernel.statusChanged.connect((_, status) => {
                        if (status == "restarting") {
                          kernel.reconnect().then(() => {
                            this.statehandler = new StateHandler(
                              this.notebooks
                            );
                            this.initStateHandling();
                          });
                        }
                      });
                      notebookComm.states.connected.onReconfigure.connect(
                        () => {
                          // Connect button clicked
                          this.updateCurrent(undefinedStates.loading);
                          notebookComm.comm.send({
                            type: "action",
                            action: "sparkconn-action-disconnect",
                          });
                        }
                      );
                      this.updateCurrent(notebookComm.states.connected);
                    }
                  } else if (
                    msg.content.data.msgtype == "sparkconn-connected" ||
                    msg.content.data.msgtype == "sparkconn-config" ||
                    msg.content.data.msgtype == "sparkconn-disconnected"
                  ) {
                    console.log(
                      title +
                        " notification-msg=" +
                        JSON.stringify(msg.content.data) +
                        " received"
                    );
                    notebookComm.comm.send({
                      type: "action",
                      action: "sparkconn-action-open",
                    });
                  } else if (
                    msg.content.data.msgtype == "sparkconn-connect-error"
                  ) {
                    console.log(
                      title +
                        " error-msg=" +
                        JSON.stringify(msg.content.data) +
                        " received"
                    );
                    notebookComm.states.connectfailed.init(
                      title,
                      msg.content.data.error as string
                    );

                    notebookComm.states.connectfailed.onReconfigure.connect(
                      () => {
                        this.updateCurrent(undefinedStates.loading);
                        notebookComm.comm.send({
                          action: "sparkconn-action-disconnect",
                        });

                        // Restart the kernel, because SparkContexts are cached,  
                        // we need to restart to do a clean retry again
                        notebookComm.notebook.sessionContext.session.kernel.restart();
                      }
                    );
                    this.updateCurrent(notebookComm.states.connectfailed);
                  } else if (
                    msg.content.data.msgtype == "sparkconn-action-follow-log"
                  ) {
                    console.debug(
                      title +
                        " log-msg=" +
                        JSON.stringify(msg.content.data) +
                        " received"
                    );
                    if (this.currentState.name() == "connected") {
                      notebookComm.states.connected.log(
                        msg.content.data.logs as string[]
                      );
                    } else if (this.currentState.name() == "connecting") {
                      notebookComm.states.connecting.log(
                        msg.content.data.logs as string[]
                      );
                    }
                  }
                };
              } else if (status == "connecting") {
                this.updateCurrent(undefinedStates.loading);
                this.statehandler.close(nbPanel.id);
              } else {
                this.updateCurrent(undefinedStates.notattached);
              }
            }
          );
        });
      }
    );
  }

  render(): JSX.Element {
    return this.currentState.render();
  }
}

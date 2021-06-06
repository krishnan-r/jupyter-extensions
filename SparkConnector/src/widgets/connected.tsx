import * as React from "react";
import { JSONExt, JSONObject } from "@lumino/coreutils";
import { IState } from "./sparkconnector";
import { ISignal, Signal } from "@lumino/signaling";

export class ConnectedState<P extends IState> {
  private template: JSX.Element;
  private logs: Signal<this, string[]>;
  public onReconfigure: ISignal<this, void>;

  init(
    notebookTitle: string,
    sparkVersion: string,
    cluster: string,
    session: JSONObject
  ): void {
    const onReconfigure = new Signal<this, void>(this);
    const logs = new Signal<this, string[]>(this);

    this.logs = logs;
    this.onReconfigure = onReconfigure;
    this.template = (
      <ConnectedComponent
        title={notebookTitle}
        sparkVersion={sparkVersion}
        cluster={cluster}
        session={session}
        onReconfigure={onReconfigure}
        logs={logs}
      />
    );
  }

  log(logs: string[]): void {
    this.logs.emit(logs);
  }

  render(): JSX.Element {
    return this.template;
  }

  name(): string {
    return "connected";
  }
}

/**
 * @private
 */
interface IConnectedProperties
  extends React.ClassAttributes<ConnectedComponent> {
  title: string;
  cluster: string;
  sparkVersion: string;
  session: JSONObject;
  onReconfigure: Signal<ConnectedState<IState>, void>;
  logs: Signal<ConnectedState<IState>, string[]>;
}

/**
 * @private
 */
class ConnectedComponent extends React.Component<IConnectedProperties> {
  state = {
    shouldUpdate: true,
    logs: [] as string[],
    displayedLogs: [] as string[],
  };
  interval: number;

  constructor(props: any) {
    super(props);
    this.logSlot = this.logSlot.bind(this);
    this.props.logs.connect(this.logSlot);
  }

  logSlot(connecting: any, logs: string[]) {
    let fullLog = this.state.logs.concat(logs);
    if (this.state.shouldUpdate && this.state.logs.length == 0) {
      this.setState({
        shouldUpdate: true,
        logs: fullLog,
        displayedLogs: fullLog,
      });
    } else {
      this.setState({
        shouldUpdate: false,
        logs: fullLog,
        displayedLogs: this.state.displayedLogs,
      });
    }
  }

  updateDisplayedLogs() {
    let logs;
    if (this.state.logs.length > 5000) {
      logs = [".. showing only last 5000 lines .."];
      logs = logs.concat(this.state.logs.slice(1000, -1));
    } else {
      logs = this.state.logs;
    }
    this.setState({
      shouldUpdate: true,
      logs: logs,
      displayedLogs: logs,
    });
  }

  shouldComponentUpdate(nextProps: any, nextState: any): boolean {
    return nextState.shouldUpdate;
  }

  componentDidMount(): void {
    this.interval = setInterval(() => this.updateDisplayedLogs(), 1000);
  }

  componentWillUnmount(): void {
    this.setState({
      shouldUpdate: false,
      logs: [],
      displayedLogs: [],
    });
    this.props.logs.disconnect(this.logSlot);
    clearInterval(this.interval);
  }

  getDriverUI(session: JSONObject): string {
    if (!JSONExt.isPrimitive(session["driverui"])) {
      return null;
    }
    return JSONExt.deepCopy(session["driverui"]) as string;
  }

  /**
   * Renders a table of contents tree.
   */
  render() {
    let driverui = this.getDriverUI(this.props.session);
    let onReconfigure = this.props.onReconfigure;
    //let logs = this.props.logs;

    const onClick = () => {
      onReconfigure.emit();
    };

    return (
      <div className="jp-SparkConnector">
        <div className="jp-SparkConnector-panel">
          <span className="jp-SparkConnector-panelLabel">
            {this.props.title}
          </span>
        </div>
        <div className="jp-SparkConnector-details">
          <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
            spark connected
          </header>
          <div className="jp-SparkConnector-confDetailsContainer">
            <ul className="jp-SparkConnector-confDetailsList">
              <li className="jp-SparkConnector-confDetailsListItem">
                Cluster {this.props.cluster}
              </li>
              <li className="jp-SparkConnector-confDetailsListItem">
                Spark {this.props.sparkVersion}
              </li>
            </ul>
          </div>
        </div>
        <div className="jp-SparkConnector-details">
          <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
            connection resources
          </header>
          <div className="jp-SparkConnector-confDetailsContainer">
            <ul className="jp-SparkConnector-confDetailsList">
              {driverui && (
                <li className="jp-SparkConnector-confDetailsListItem">
                  <a href={driverui} target="_blank">
                    Driver UI
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="jp-SparkConnector-details">
          <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
            connection logs
          </header>
          <div className="jp-SparkConnector-confDetailsContainer">
            <LogList logs={this.state.displayedLogs} />
          </div>
        </div>
        <div className="jp-SparkConnector-button">
          <button
            className="jp-SparkConnector-panelConnect jp-mod-styled "
            id="actionbutton"
            onClick={onClick}
          >
            reconfigure
          </button>
        </div>
      </div>
    );
  }
}

/**
 * @private
 */
interface ILogListProperties extends React.ClassAttributes<LogList> {
  logs: string[];
}

/**
 * @private
 */
class LogList extends React.Component<ILogListProperties> {
  render() {
    return (
      <div className="jp-SparkConnector-confDetailsContainer-sparkLogs info">
        {this.props.logs.map(
          function (log: string, idx: number) {
            return <pre key={idx}>{log}</pre>;
          }.bind(this)
        )}
      </div>
    );
  }
}

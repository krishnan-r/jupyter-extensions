import * as React from "react";
import { IState } from "./sparkconnector";
import { ISignal, Signal } from "@lumino/signaling";
import { LogList } from "./components/loglist";

export class ConnectedState<P extends IState> {
  private template: JSX.Element;
  private logs: Signal<this, string>;
  public onReconfigure: ISignal<this, void>;

  init(
    notebookTitle: string,
    driverUiUrl: string
  ): void {
    const onReconfigure = new Signal<this, void>(this);
    const logs = new Signal<this, string>(this);

    this.logs = logs;
    this.onReconfigure = onReconfigure;
    this.template = (
      <ConnectedComponent
        title={notebookTitle}
        driverUiUrl={driverUiUrl}
        onReconfigure={onReconfigure}
        logs={logs}
      />
    );
  }

  log(message: string): void {
    this.logs.emit(message);
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
  // cluster: string;
  // sparkVersion: string;
  driverUiUrl: string;
  onReconfigure: Signal<ConnectedState<IState>, void>;
  logs: Signal<ConnectedState<IState>, string>;
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

  logSlot(connecting: any, message: string) {
    let fullLog = this.state.logs.concat(message);
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

  render() {
    let driverui = this.props.driverUiUrl
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
                {/* Cluster {this.props.cluster} */}
              </li>
              <li className="jp-SparkConnector-confDetailsListItem">
                {/* Spark {this.props.sparkVersion} */}
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
              <li>Spark History Server is available <a>here</a></li>
              <li>Spark Metrics are not enabled. (Please add the bundle to enable)</li>
              <li>Spark Driver Logs of the running application</li>
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
          <button
            className="jp-SparkConnector-panelConnect jp-mod-styled jp-SparkConnector-button"
            id="actionbutton"
            onClick={onClick}
          >
            reconfigure
          </button>
      </div>
    );
  }
}
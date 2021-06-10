import * as React from "react";
import { IState } from "./sparkconnector";
import { ISignal, Signal } from "@lumino/signaling";

export class ConnectFailedState<P extends IState> {
  private template: JSX.Element;
  public onReconfigure: ISignal<this, void>;

  init(notebookTitle: string, error: string): void {
    const signal = new Signal<this, void>(this);

    this.onReconfigure = signal;
    this.template = (
      <ConnectFailedComponent
        title={notebookTitle}
        error={error}
        signal={signal}
      />
    );
  }

  render(): JSX.Element {
    return this.template;
  }

  name(): string {
    return "connectfailed";
  }
}

/**
 * Interface describing component properties.
 *
 * @private
 */
interface IConnectFailedProperties
  extends React.ClassAttributes<ConnectFailedComponent> {
  title: string;
  error: string;
  signal: Signal<ConnectFailedState<IState>, void>;
}

/**
 * React component for a table of contents tree.
 *
 * @private
 */
class ConnectFailedComponent extends React.Component<IConnectFailedProperties> {
  /**
   * Renders a table of contents tree.
   */
  render() {
    let signal = this.props.signal;

    const onClick = () => {
      signal.emit();
    };
    return (
      <div className="jp-SparkConnector">
        <div className="jp-SparkConnector-panel">
          <span className="jp-SparkConnector-panelLabel">
            {this.props.title}
          </span>
        </div>
        <div className="jp-SparkConnector-details jp-SparkConnector-failed">
          <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
            spark connection failed
          </header>
          <div className="jp-SparkConnector-confDetailsContainer">
            <div className="jp-SparkConnector-confDetailsContainer-sparkLogs alert">
              {this.props.error}
            </div>
          </div>
        </div>
          <button
            className="jp-SparkConnector-panelConnect jp-mod-styled jp-SparkConnector-button"
            id="actionbutton"
            onClick={onClick}
          >
            Try Again
          </button>
      </div>
    );
  }
}

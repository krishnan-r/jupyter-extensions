import React from 'react';
import { IState } from './sparkconnector'
import {Signal} from "@lumino/signaling";

export class ConnectingState<P extends IState> {

    private template: JSX.Element;
    private logs: Signal<this, string[]>;

    init(notebookTitle: string, sparkVersion: string, cluster: string): void {
        const logs = new Signal<this,string[]>(this);

        this.logs = logs;
        this.template = (<Connecting
            title={notebookTitle}
            sparkVersion={sparkVersion}
            cluster={cluster}
            logs={logs}
        />);
    }

    log(logs: string[]): void {
        this.logs.emit(logs);
    }

    render(): JSX.Element {
        return this.template;
    }

    name(): string {
        return "connecting";
    }
}

/**
 * @private
 */
interface IConnectingProperties extends React.ClassAttributes<Connecting> {
    title: string;
    cluster: string;
    sparkVersion: string;
    logs: Signal<ConnectingState<IState>,string[]>;
}

/**
 * @private
 */
class Connecting extends React.Component<IConnectingProperties> {

    state = {
        logs: [] as string[],
    };

    constructor(props: any) {
        super(props);
        this.logSlot = this.logSlot.bind(this);
    }

    logSlot(connecting:any, logs: string[]) {
        let fullLog = this.state.logs.concat(logs);
        this.setState({
            logs: fullLog
        });
    }

    componentDidMount(): void {
        this.setState({
            logs: ['Waiting for spark context to start']
        });
        this.props.logs.connect(this.logSlot);
    }

    componentWillUnmount(): void {
        this.setState({
            logs: []
        });
        this.props.logs.disconnect(this.logSlot);
    }

    render() {
        return (
            <div className="jp-SparkConnector">
                <div className="jp-SparkConnector-loading"></div>
                <div className="jp-SparkConnector-panel">
                    <span className="jp-SparkConnector-panelLabel">{this.props.title}</span>
                </div>
                <div className="jp-SparkConnector-details">
                    <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">spark connecting</header>
                    <div className="jp-SparkConnector-confDetailsContainer">
                        <ul className="jp-SparkConnector-confDetailsList">
                            <li className="jp-SparkConnector-confDetailsListItem">Cluster {this.props.cluster}</li>
                            <li className="jp-SparkConnector-confDetailsListItem">Spark {this.props.sparkVersion}</li>
                        </ul>
                    </div>
                </div>
                <div className="jp-SparkConnector-details">
                    <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">connection logs</header>
                    <div className="jp-SparkConnector-confDetailsContainer">
                        <LogList logs={this.state.logs}/>
                    </div>
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

    private divRef: React.RefObject<any>;

    constructor(props: any) {
        super(props);
        this.divRef = React.createRef()
    }

    componentDidUpdate(): void {
        this.divRef.current.scrollTop = this.divRef.current.scrollHeight;
    }

    render() {
        return (
            <div className="jp-SparkConnector-confDetailsContainer-sparkLogs info" ref={this.divRef}>
                {
                    this.props.logs.map(function(log: string, idx: number) {
                        return (<pre key={idx}>{log}</pre>);
                    }.bind(this))
                }
            </div>
        );
    }
}
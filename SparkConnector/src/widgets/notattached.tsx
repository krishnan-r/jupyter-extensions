import * as React from 'react';
import { IState } from './sparkconnector'

export class NotAttachedState<P extends IState> {

    render(): JSX.Element {
        return <NotAttachedComponent/>;
    }

    name(): string {
        return "notattached";
    }
}

/**
 * @private
 */
class NotAttachedComponent extends React.Component {

    render() {
        return (
            <div className="jp-SparkConnector">
                <div className="jp-SparkConnector-notattached"></div>
            </div>
        );
    }
}

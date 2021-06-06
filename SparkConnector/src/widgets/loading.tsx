import * as React from "react";
import { IState } from "./sparkconnector";

export class LoadingState<P extends IState> {
  render(): JSX.Element {
    return <LoadingComponent />;
  }

  name(): string {
    return "loading";
  }
}

/**
 * React component for a table of contents tree.
 *
 * @private
 */
class LoadingComponent extends React.Component {
  /**
   * Renders a table of contents tree.
   */
  render() {
    return (
      <div className="jp-SparkConnector">
        <div className="jp-SparkConnector-loading"></div>
      </div>
    );
  }
}

import React from 'react';

/*
  Display a list of log output in monospace font.
*/
export const LogList = (props: { logs: Array<string> }) => {
  return (
    <div className="jp-SparkConnector-confDetailsContainer-sparkLogs info">
      {props.logs.map((log: string, idx: number) => {
        return <pre key={idx}>{log}</pre>;
      })}
    </div>
  );
};

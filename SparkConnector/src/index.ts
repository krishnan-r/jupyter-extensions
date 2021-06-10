import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker} from '@jupyterlab/notebook';
import {SparkConnector} from "./widgets/sparkconnector";

/**
* Initialization data for the hdfsbrowser extension.
*/
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sparkconnector',
  requires: [
      ILabShell,
      INotebookTracker,
      ILayoutRestorer,
  ],
  activate: activate,
  autoStart: true,
};

export default plugin;

/**
* Activate the running plugin.
*/
function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  notebooks: INotebookTracker,
  restorer: ILayoutRestorer
): void {
  const spc = new SparkConnector(notebooks);
  spc.title.iconClass = 'jp-SparkConnector-icon jp-SideBar-tabIcon';
  spc.title.caption = 'Spark Connector';
  spc.id = 'spark-connector';
  labShell.add(spc, 'right', { rank: 700 });

  // Add a menu for the plugin
  console.log('JupyterLab 3 SparkConnector is activated!');
}

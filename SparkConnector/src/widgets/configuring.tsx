import React from "react";
import { JSONExt, JSONArray, JSONObject, JSONValue } from "@lumino/coreutils";
import { IState, SparkOpt, SparkconnectMetadata } from "./sparkconnector";
import { InputSparkComponent } from "./inputsparkopts";
import { ISignal, Signal } from "@lumino/signaling";
//import { buildIcon} from '@jupyterlab/ui-components';
import { addIcon, checkIcon, closeIcon } from "@jupyterlab/ui-components";
export class ConfigurationState<P extends IState> {
  private template: JSX.Element;
  public onConnect: ISignal<this, JSONObject>;

  init(
    notebookTitle: string,
    maxMemory: string,
    sparkVersion: string,
    cluster: string,
    currentOptions: SparkconnectMetadata,
    availableOptions: JSONObject,
    availableBundles: JSONObject
  ): void {
    const signal = new Signal<this, JSONObject>(this);

    console.log(
      notebookTitle + " currentOptions=" + JSON.stringify(currentOptions)
    );
    console.log(
      notebookTitle + " availableOptions=" + JSON.stringify(availableOptions)
    );
    console.log(
      notebookTitle + " availableBunbles=" + JSON.stringify(availableBundles)
    );

    const bundleOptions = availableBundles?.bundled_options ?? [];
    const availableSparkOptions = availableOptions?.spark_options ?? [];

    this.onConnect = signal;
    this.template = (
      <ConfigurationComponent
        title={notebookTitle}
        sparkVersion={sparkVersion}
        maxMemory={maxMemory}
        cluster={cluster}
        currentOptions={currentOptions}
        availableSparkOptions={availableSparkOptions as any}
        availableBundles={bundleOptions as any}
        signal={signal}
      />
    );
  }

  render(): JSX.Element {
    return this.template;
  }

  name(): string {
    return "configuring";
  }
}

interface AvailableBundles {
  [bundleName: string]: SparkBundleObj;
}

interface ShowConfigProps {
  availableBundles: AvailableBundles;
  bundles: Array<string>;
  configs: Array<SparkOpt>;
  handleRemoveConfig: Function;
  handleRemoveBundle: Function;
}

class ShowConfig extends React.Component<ShowConfigProps, any> {
  constructor(props: ShowConfigProps) {
    super(props);
    console.log("props", this.props);
    this.removeConfig = this.removeConfig.bind(this);
  }
  removeConfig(e: any) {
    console.log(e);
    this.props.handleRemoveConfig(e.currentTarget.id);
  }
  renderConf(config: SparkOpt) {
    const DeleteIcon = closeIcon.react;
    return (
      <li className="config-group" key={config["name"] + "-config"}>
        <div className="config-option">
          <ul className="options-list">
            <li key={config["name"]}>
              <span className="jp-SparkConnector-optionName">
                {config["name"]}
              </span>
            </li>
            <li key={config["name"] + "-value"}>{config["value"]}</li>
          </ul>
        </div>
        <div className="config-remove">
          <button
            className="remove"
            id={config["name"]}
            onClick={this.removeConfig}
          >
            <DeleteIcon />
          </button>
        </div>
      </li>
    );
  }
  getOptionsList(configArray: Array<SparkOpt>) {
    return configArray.map((config) => this.renderConf(config));
  }
  render() {
    let configsList;
    if (this.props.configs) {
      configsList = this.getOptionsList(this.props.configs);
    } else configsList = "";
    let bundlesList;
    if (this.props.bundles) {
      bundlesList = this.props.bundles.map((x: any) => {
        return (
          <ShowBundle
            bundleName={x}
            availableBundles={this.props.availableBundles}
            removeBundle={this.props.handleRemoveBundle}
          />
        );
      });
    } else {
      configsList = "";
    }
    return (
      <div className="jp-SparkConnector-details">
        <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
          Selected Spark Configurations
        </header>
        <div className="jp-SparkConnector-confDetailsContainer">
          <ul className="options-list">
            <div className="jp-SparkConnector-itemsList">{configsList}</div>
          </ul>
          <ul className="options-list">
            <div className="jp-SparkConnector-itemsList">{bundlesList}</div>
          </ul>
        </div>
      </div>
    );
  }
}

interface ShowBundleProps {
  removeBundle: Function;
  availableBundles: AvailableBundles;
  bundleName: string;
}

class ShowBundle extends React.Component<ShowBundleProps, {}> {
  constructor(props: ShowBundleProps) {
    super(props);
    this.removeBundle = this.removeBundle.bind(this);
  }
  removeBundle(e: any) {
    this.props.removeBundle(e.currentTarget.id);
  }
  renderConf(config: any) {
    return (
      <ul className="options-list">
        <li>
          <div className="jp-SparkConnector-optionName">{config["name"]}</div>
        </li>
        <li>{config["value"]}</li>
      </ul>
    );
  }
  getBundleOptionsList(bundleName: string) {
    return this.props.availableBundles[bundleName]["options"].map((x: any) =>
      this.renderConf(x)
    );
  }
  render() {
    const DeleteIcon = closeIcon.react;
    let configsList = this.getBundleOptionsList(this.props.bundleName);
    return (
      <li className="config-group">
        <div className="config-option">
          {this.props.bundleName}
          {configsList}
        </div>
        <div className="config-remove">
          <button
            className="remove"
            id={this.props.bundleName}
            onClick={this.removeBundle}
          >
            <DeleteIcon />
          </button>
        </div>
      </li>
    );
  }
}

interface SparkClusterVersion {
  cluster: string;
  sparkVersion: string;
}

class SparkConnectionDetails extends React.Component<SparkClusterVersion, {}> {
  render() {
    return (
      <div className="jp-SparkConnector-details">
        <div>
          <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
            spark connection
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
      </div>
    );
  }
}

interface SparkBundleOption {
  name: string;
  concatenate?: string;
  value: string;
}

interface SparkBundleObj {
  cluster_filter: Array<string>;
  options: Array<SparkBundleOption>;
  spark_version_filter: Array<string>;
}

interface ChooseBundleProps {
  availableBundles: AvailableBundles;
  handleAddBundle: Function;
  handleRemoveBundle: Function;
  activeBundles: any;
}

class ChooseBundles extends React.Component<ChooseBundleProps, {}> {
  constructor(props: ChooseBundleProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.toggleBundle = this.toggleBundle.bind(this);
  }
  addBundle(bundleName: string) {
    this.props.handleAddBundle(bundleName);
  }
  removeBundle(bundleName: string) {
    this.props.handleRemoveBundle(bundleName);
  }
  toggleBundle(bundleName: string) {
    const index = this.props.activeBundles.indexOf(bundleName);
    if (index > -1) {
      this.removeBundle(bundleName);
    } else {
      this.addBundle(bundleName);
    }
  }
  onClick(e: any) {
    const bundleName = e.currentTarget.value;
    this.toggleBundle(bundleName);
  }
  render() {
    const SelectedIcon = checkIcon.react;
    const NotSelectedIcon = addIcon.react;
    let suggestionListComponent = Object.keys(this.props.availableBundles).map(
      (k: string, index: number) => {
        let selected;
        if (this.props.activeBundles.indexOf(k) > -1) {
          selected = <SelectedIcon />;
        } else {
          selected = <NotSelectedIcon />;
        }
        return (
          <li key={index}>
            {selected}{" "}
            <button
              className="button-noborder"
              value={k}
              onClick={this.onClick}
            >
              {" "}
              {k}
            </button>
          </li>
        );
      }
    );
    return (
      <div className="jp-SparkConnector-details">
        <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
          Add Configuration Bundle
        </header>
        <div className="jp-SparkConnector-confDetailsContainer">
          <ul className="jp-SparkConnector-confDetailsList">
            <li className="jp-SparkConnector-confDetailsListItem">
              These options will be overwritten by non-bundled configuration if
              specified
            </li>
          </ul>
        </div>
        <div className="jp-SparkConnector-confDetailsContainer">
          <ul className="jp-SparkConnector-bundlesList">
            {suggestionListComponent}
          </ul>
        </div>
      </div>
    );
  }
}

/**
 * Interface describing component properties.
 *
 * @private
 */
interface IConfigurationProperties
  extends React.ClassAttributes<ConfigurationComponent> {
  currentOptions: SparkconnectMetadata;
  availableSparkOptions: Array<any>;
  availableBundles: AvailableBundles;
  title: string;
  cluster: string;
  maxMemory: string;
  sparkVersion: string;
  signal: Signal<ConfigurationState<IState>, JSONObject>;
}

interface SparkOptionsToKernel {
  [configName: string]: string;
}
/**
 * React component for a table of contents tree.
 *
 * @private
 */
class ConfigurationComponent extends React.Component<
  IConfigurationProperties,
  SparkconnectMetadata
> {
  constructor(props: IConfigurationProperties) {
    super(props);
    console.log("initializing the state with: ", this.props.currentOptions);
    console.log("initializing the state with: ", this.props);
    this.state = {
      list_of_options: this.props.currentOptions["list_of_options"] as Array<
        SparkOpt
      >,
      bundled_options: this.props.currentOptions["bundled_options"] as Array<
        string
      >,
    };
    this.handleAddBundle = this.handleAddBundle.bind(this);
    this.handleRemoveBundle = this.handleRemoveBundle.bind(this);
    this.handleAddConfig = this.handleAddConfig.bind(this);
    this.handleRemoveConfig = this.handleRemoveConfig.bind(this);
  }
  getOptionsArray(): JSONArray {
    return this.props.availableSparkOptions as Array<any>;
  }

  getOptionLabel(option: JSONValue): string {
    if (JSONExt.isPrimitive(option)) {
      // this happens in case of self-added options
      return option as string;
    }

    if (!JSONExt.isObject(option)) {
      throw new Error("spark option value not found");
    }
    if (!JSONExt.isPrimitive(option["value"])) {
      throw new Error("spark option invalid");
    }
    return JSONExt.deepCopy(option["value"]) as string;
  }

  getOptionGroup(option: JSONValue) {
    if (!JSONExt.isObject(option)) {
      throw new Error("spark option data not found");
    }
    if (!JSONExt.isObject(option["data"])) {
      return "Spark";
    }
    if (!JSONExt.isPrimitive(option["data"]["category"])) {
      return "Spark";
    }
    return JSONExt.deepCopy(option["data"]["category"]) as string;
  }

  handleRemoveBundle(a: any) {
    let newSparkBundles = this.state.bundled_options;
    const index = newSparkBundles.indexOf(a);
    newSparkBundles.splice(index, 1);
    this.setState({
      bundled_options: newSparkBundles,
    });
  }

  handleAddBundle(bundleName: string) {
    const opt = this.state.bundled_options.slice();
    opt.push(bundleName);
    this.setState({
      bundled_options: opt,
    });
  }

  handleRemoveConfig(a: any) {
    const newSparkOptions = this.state.list_of_options.filter((x: any) => {
      return x["name"] != a;
    });
    this.setState({
      list_of_options: newSparkOptions,
    });
  }

  handleAddConfig(name: string, value: string) {
    const opt = this.state.list_of_options.slice();
    opt.push({ name: name, value: value });
    this.setState({
      list_of_options: opt,
    });
  }

  connectOnClick = () => {
    let options = {} as SparkOptionsToKernel;
    this.state.list_of_options.map((x: any) => {
      options[x["name"]] = x["value"];
    });
    //here the bundles are merged with the other configurations
    //behaviour: if key in bundle does not exist already, it is created
    //if it exists already, we check the "concatenate" value:
    //if it exists, we use it to concatenate to the existing conf,
    //otherwise we don't add it: the choices of the user have higher priority
    this.state.bundled_options.map((bundleName: string) => {
      this.props.availableBundles[bundleName]["options"].map(
        (bundleOption: SparkBundleOption) => {
          if (bundleOption["name"] in options) {
            if (
              bundleOption.hasOwnProperty("concatenate") &&
              bundleOption["concatenate"] != ""
            ) {
              options[bundleOption["name"]] =
                options[bundleOption["name"]] +
                bundleOption["concatenate"] +
                bundleOption["value"];
            } //else we don't add it
          } else {
            //we create the new option
            options[bundleOption["name"]] = options[bundleOption["value"]];
          }
        }
      );
    });
    let metadata = {
      bundled_options: this.state.bundled_options,
      list_of_options: this.state.list_of_options,
    };

    let message: {
      options: {};
      metadata: {
        bundled_options: Array<string>;
        list_of_options: Array<SparkOpt>;
      };
    } = { options: options, metadata: metadata };

    console.log("emitting", this.state);
    console.log("sending otions", options);
    this.props.signal.emit((message as unknown) as JSONObject);
  };
  /**
   * Renders a table of contents tree.
   */
  render() {
    return (
      <div className="jp-SparkConnector">
        <div className="jp-SparkConnector-panel">
          <span className="jp-SparkConnector-panelLabel">
            {this.props.title}
          </span>
        </div>

        <div className="scrollable">
          <SparkConnectionDetails
            cluster={this.props.cluster}
            sparkVersion={this.props.sparkVersion}
          />
          <ChooseBundles
            handleAddBundle={this.handleAddBundle}
            handleRemoveBundle={this.handleRemoveBundle}
            availableBundles={this.props.availableBundles}
            activeBundles={this.state.bundled_options}
          />
          <InputSparkComponent
            handleAddConfig={this.handleAddConfig}
            suggestions={this.getOptionsArray().map((x: any) => x.value)}
          />
          <ShowConfig
            availableBundles={this.props.availableBundles}
            bundles={this.state.bundled_options}
            configs={this.state.list_of_options}
            handleRemoveConfig={this.handleRemoveConfig}
            handleRemoveBundle={this.handleRemoveBundle}
          />
        </div>
        <div className="jp-SparkConnector-button">
          <button
            className="jp-SparkConnector-panelConnect jp-mod-styled "
            id="actionbutton"
            onClick={this.connectOnClick}
          >
            connect
          </button>
        </div>
      </div>
    );
  }
}

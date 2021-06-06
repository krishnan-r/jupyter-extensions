import React from "react";
import { JSONArray } from "@lumino/coreutils";

class InputSparkOpts {
  suggestions: Array<string>;
  constructor(input: JSONArray) {
    this.suggestions = input.map((x: any) => x.value);
  }
  handleAddConfig: Function;
}

interface InpSparkState {
  activeSuggestion: number;
  showSuggestions: boolean;
  userInput: string;
  nameInput: string;
  valueInput: string;
  filteredSuggestions: Array<string>;
  selecting: "sparkOptionName" | "sparkOptionValue";
}

export class InputSparkComponent extends React.Component<
  InputSparkOpts,
  InpSparkState
> {
  constructor(props: InputSparkOpts) {
    super(props);
    this.state = {
      activeSuggestion: 0,
      filteredSuggestions: [],
      showSuggestions: false,
      userInput: "",
      nameInput: "",
      valueInput: "",
      selecting: "sparkOptionName",
    };
    this.addConfig = this.addConfig.bind(this);
  }
  env_field = "{ENV_VAR_NAME}";
  addConfig = () => {
    const a = this.state.nameInput;
    const b = this.state.valueInput;
    this.props.handleAddConfig(a, b);
    this.setState({
      activeSuggestion: 0,
      filteredSuggestions: [],
      showSuggestions: false,
      userInput: "",
      nameInput: "",
      valueInput: "",
      selecting: "sparkOptionName",
    });
  };
  userInputEnvVar(filteredSuggestions: any, activeSuggestion: number) {
    //handles EnvVar options submissions: edits the input field to allow the user to set the EnvVar name
    if (filteredSuggestions[activeSuggestion]) {
      return filteredSuggestions[activeSuggestion].substr(
        0,
        filteredSuggestions[activeSuggestion].indexOf(
          "[EnvironmentVariableName]"
        )
      );
    } else {
      return document.getElementById("jp-SparkConnector-confInput").innerText;
    }
  }
  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { activeSuggestion, filteredSuggestions } = this.state;

    if (e.keyCode === 13) {
      if (this.state.selecting === "sparkOptionName") {
        if (
          filteredSuggestions[activeSuggestion] &&
          filteredSuggestions[activeSuggestion].indexOf(
            "[EnvironmentVariableName]"
          ) > -1
        ) {
          this.setState(
            {
              userInput: this.userInputEnvVar(
                filteredSuggestions,
                activeSuggestion
              ),

              showSuggestions: false,
            },
            () => document.getElementById("jp-SparkConnector-confInput").focus()
          );
        } else {
          this.setState({
            activeSuggestion: 0,
            showSuggestions: false,
            nameInput: filteredSuggestions[activeSuggestion]
              ? filteredSuggestions[activeSuggestion]
              : this.state.userInput,
            userInput: "",
            selecting: "sparkOptionValue",
          });
        }
      } else {
        this.setState(
          {
            activeSuggestion: 0,
            showSuggestions: false,
            valueInput: e.currentTarget.value,
          },
          () => this.addConfig()
        );
        //handle option value
      }
    } else if (e.keyCode === 38) {
      if (activeSuggestion === 0) {
        return;
      }

      this.setState({ activeSuggestion: activeSuggestion - 1 });
    } else if (e.keyCode === 40) {
      if (activeSuggestion - 1 === filteredSuggestions.length) {
        return;
      }

      this.setState({ activeSuggestion: activeSuggestion + 1 });
    }
  };

  onClick = (e: any) => {
    if (this.state.selecting == "sparkOptionName") {
      if (e.currentTarget.innerText == "ADD CONFIGURATION") {
        console.log("its empy");
        return;
      }
      if (e.currentTarget.innerText.indexOf("[EnvironmentVariableName]") > -1) {
        this.setState(
          {
            userInput: e.currentTarget.innerText.substr(
              0,
              e.currentTarget.innerText.indexOf("[EnvironmentVariableName]")
            ),
            showSuggestions: false,
          },
          () => document.getElementById("jp-SparkConnector-confInput").focus()
        );
      } else {
        this.setState({
          activeSuggestion: 0,
          filteredSuggestions: [],
          showSuggestions: false,
          nameInput: e.currentTarget.innerText,
          userInput: "",
          selecting: "sparkOptionValue",
        });
      }
    } else {
      this.setState({ valueInput: this.state.userInput }, () => {
        this.addConfig();
      });
    }
  };
  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { suggestions } = this.props;
    const valueInput = e.currentTarget.value;

    // Filter our suggestions that don't contain the user's input
    const filteredSuggestions = suggestions.filter(
      (suggestion: any) =>
        suggestion.toLowerCase().indexOf(valueInput.toLowerCase()) > -1
    );

    this.setState({
      activeSuggestion: 0,
      filteredSuggestions,
      showSuggestions: true,
      userInput: e.currentTarget.value,
    });
  };
  backToOptionName = () => {
    this.setState({
      activeSuggestion: 0,
      filteredSuggestions: [],
      showSuggestions: false,
      userInput: "",
      nameInput: "",
      valueInput: "",
      selecting: "sparkOptionName",
    });
  };

  render() {
    const {
      onChange,
      onClick,
      onKeyDown,

      state: {
        activeSuggestion,
        filteredSuggestions,
        showSuggestions,
        userInput,
      },
    } = this;

    let suggestionsListComponent;
    let boxTitle;
    if (this.state.selecting === "sparkOptionName") {
      boxTitle = (
        <span className="jp-SparkConnector-itemAddConf jp-mod-styled">
          {" "}
          Select a Spark option{" "}
        </span>
      );
    } else {
      boxTitle = (
        <button
          className="jp-SparkConnector-itemAddConf jp-mod-styled"
          onClick={this.backToOptionName}
        >
          {this.state.nameInput}
        </button>
      );
    }

    if (
      showSuggestions &&
      userInput &&
      this.state.selecting === "sparkOptionName"
    ) {
      if (filteredSuggestions.length) {
        suggestionsListComponent = (
          <ul className="sparkOptions-suggestions">
            {filteredSuggestions.map((suggestion: any, index: number) => {
              let className;

              // Flag the active suggestion with a class
              if (index === activeSuggestion) {
                className = "sparkOptions-suggestion-active";
              }

              return (
                <li className={className} key={suggestion} onClick={onClick}>
                  {suggestion}
                </li>
              );
            })}
          </ul>
        );
      } else {
        suggestionsListComponent = (
          <div>
            <em>No suggestions</em>
          </div>
        );
      }
    }

    return (
      <React.Fragment>
        <div className="jp-SparkConnector-details">
          <header className="jp-SparkConnector-confDetailsHeader jp-SparkConnector-border">
            add spark configuration
          </header>

          <div className="jp-SparkConnector-confDetailsContainer">
            <ul className="jp-SparkConnector-confDetailsList">
              <li className="jp-SparkConnector-confDetailsListItem">
                Available configurations are available{" "}
                <a
                  href="https://spark.apache.org/docs/latest/configuration#available-properties"
                  title="SparkConf options"
                >
                  here
                </a>
              </li>
              <li className="jp-SparkConnector-confDetailsListItem">
                Environment variables can be used via {this.env_field}
              </li>
              <li>
                {boxTitle}
                <br />
                <input
                  type="text"
                  onChange={onChange}
                  onKeyDown={onKeyDown}
                  value={userInput}
                  id="jp-SparkConnector-confInput"
                />
                {suggestionsListComponent}
                <br />
                <div className="jp-SparkConnector-confDetailsContainer">
                  <div className="jp-SparkConnector-confDetailsContainer-sparkOptions">
                    <button
                      className="jp-SparkConnector-itemAddConf jp-mod-styled"
                      onClick={onClick}
                    >
                      add configuration
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { Paper, Typography, Slider } from "@material-ui/core";
import { Tabs, Tab, Container, Row, Col, Button } from "react-bootstrap";

import { ReactTable } from "./../../../components";

import {
  fetchEvent,
  fetchTeamEvents,
  fetchRankings,
  fetchMatches_Event,
  fetchSimFull,
} from "./../../../api";

import styles from "./EventView.module.css";

export default function EventView() {
  let { key } = useParams();

  const [event, setEvent] = useState("");
  const [year, setYear] = useState("");
  const [teams, setTeams] = useState([]);

  const [acc, setAcc] = useState(0);
  const [rp1Acc, setRp1Acc] = useState(0);
  const [rp2Acc, setRp2Acc] = useState(0);

  const [rankings, setRankings] = useState([]);
  const [rawStats, setRawStats] = useState([]);
  const [stats, setStats] = useState([]);

  const [rawMatches, setRawMatches] = useState([]);
  const [matches, setMatches] = useState([]);

  const [quals, setQuals] = useState(50);
  const [index, setIndex] = useState(0);
  const [simState, setSimState] = useState("None");
  const [rawSim, setRawSim] = useState([]);
  const [cleanSim, setCleanSim] = useState([]);

  //column name, searchable, visible, link, hint
  const columns = [
    ["Number", true, true, false, ""],
    ["Name", true, true, true, "Click name for details"],
    ["Rank", false, true, false, "Rank at Event"],
    ["Elo", false, true, false, "Current Elo"],
    ["OPR", false, true, false, "Current OPR"],
    ["Auto OPR", false, true, false, ""],
    ["Teleop OPR", false, true, false, ""],
    ["Endgame OPR", false, true, false, ""],
    ["ILS 1", false, true, false, ""],
    ["ILS 2", false, true, false, ""],
  ];

  //column name, searchable, visible, link, hint
  const oldColumns = [
    ["Number", true, true, false, ""],
    ["Name", true, true, true, "Click name for details"],
    ["Rank", false, true, false, "Rank at Event"],
    ["Elo", false, true, false, "Current Elo"],
    ["OPR", false, true, false, "Current OPR"],
  ];

  //column name, searchable, visible, link, hint
  const simColumns = [
    ["Predicted Rank", false, true, false, ""],
    ["Number", true, true, false, ""],
    ["Name", true, true, true, "Click name for details"],
    ["Mean Rank", false, true, false, ""],
    ["Highest Rank", false, true, false, ""],
    ["5% Rank", false, true, false, ""],
    ["95% Rank", false, true, false, ""],
    ["Lowest Rank", false, true, false, ""],
  ];

  useEffect(() => {
    const getEvent = async (key) => {
      const event = await fetchEvent(key);
      setEvent(event["name"]);
      setYear(event["year"]);
      setAcc(event["mix_acc"]);
      setRp1Acc(event["rp1_acc"]);
      setRp2Acc(event["rp2_acc"]);
    };

    const getTeamEvents = async (key) => {
      const team_events = await fetchTeamEvents(key, "-elo_end");
      setRawStats(team_events);
    };

    const getRankings = async (key) => {
      const rankings = await fetchRankings(key);
      setRankings(rankings);
    };

    const getMatches = async (key) => {
      const matches = await fetchMatches_Event(key);
      setRawMatches(matches);
    };

    getEvent(key);
    getTeamEvents(key);
    getRankings(key);
    getMatches(key);
  }, [key]);

  useEffect(() => {
    function clean(rawStats, rankings) {
      let cleanStats;
      let teams = [];
      if (year >= 2016) {
        cleanStats = rawStats.map(function (x, i) {
          teams.push({ team: x["team"], name: x["name"] });
          return [
            x["team"],
            "./../teams/" + x["team"] + "|" + x["name"],
            rankings[x["team"]],
            x["elo_end"],
            parseInt(x["opr_no_fouls"] * 10) / 10,
            parseInt(x["opr_auto"] * 10) / 10,
            parseInt(x["opr_teleop"] * 10) / 10,
            parseInt(x["opr_endgame"] * 10) / 10,
            x["ils_1_end"],
            x["ils_2_end"],
          ];
        });
      } else {
        cleanStats = rawStats.map(function (x, i) {
          teams.push([x["team"], x["name"]]);
          return [
            x["team"],
            "./../teams/" + x["team"] + "|" + x["name"],
            rankings[x["team"]],
            x["elo_end"],
            parseInt(x["opr_end"] * 10) / 10,
          ];
        });
      }
      setTeams(teams);
      cleanStats.sort((a, b) => a[2] - b[2]);
      return cleanStats;
    }

    setStats(clean(rawStats, rankings));
  }, [year, rawStats, rankings]);

  useEffect(() => {
    function clean(rawMatches, year) {
      let cleanMatches;
      let quals = 0;
      if (year >= 2016) {
        cleanMatches = rawMatches.map(function (x, i) {
          if (x["playoff"] === 0) {
            quals += 1;
          }
          return {
            match: x["key"].split("_")[1],
            playoff: x["playoff"],
            blue: x["blue"].split(","),
            red: x["red"].split(","),
            blue_score: x["blue_score"],
            red_score: x["red_score"],
            winner: x["winner"],
            winner_pred: x["mix_winner"],
            win_prob:
              x["mix_winner"] === "red"
                ? x["mix_win_prob"]
                : 1 - x["mix_win_prob"],
            winner_correct: x["winner"] === x["mix_winner"],
            blue_rp_1: x["blue_rp_1"],
            blue_rp_1_prob: x["blue_rp_1_prob"],
            blue_rp_1_correct:
              x["blue_rp_1"] === 1
                ? x["blue_rp_1_prob"] >= 0.5
                : x["blue_rp_1_prob"] < 0.5,
            blue_rp_2: x["blue_rp_2"],
            blue_rp_2_prob: x["blue_rp_2_prob"],
            blue_rp_2_correct:
              x["blue_rp_2"] === 1
                ? x["blue_rp_2_prob"] >= 0.5
                : x["blue_rp_2_prob"] < 0.5,
            red_rp_1: x["red_rp_1"],
            red_rp_1_prob: x["red_rp_1_prob"],
            red_rp_1_correct:
              x["red_rp_1"] === 1
                ? x["red_rp_1_prob"] >= 0.5
                : x["red_rp_1_prob"] < 0.5,
            red_rp_2: x["red_rp_2"],
            red_rp_2_prob: x["red_rp_2_prob"],
            red_rp_2_correct:
              x["red_rp_2"] === 1
                ? x["red_rp_2_prob"] >= 0.5
                : x["red_rp_2_prob"] < 0.5,
          };
        });
      } else {
        cleanMatches = rawMatches.map(function (x, i) {
          if (x["playoff"] === 0) {
            quals += 1;
          }
          return {
            match: x["key"].split("_")[1],
            playoff: x["playoff"],
            blue: x["blue"].split(","),
            red: x["red"].split(","),
            blue_score: x["blue_score"],
            red_score: x["red_score"],
            winner: x["winner"],
            winner_pred: x["mix_winner"],
            win_prob:
              x["mix_winner"] === "red"
                ? x["mix_win_prob"]
                : 1 - x["mix_win_prob"],
            winner_correct: x["winner"] === x["mix_winner"],
          };
        });
      }
      setQuals(quals);
      return cleanMatches;
    }

    setMatches(clean(rawMatches, year));
  }, [year, rawMatches]);

  useEffect(() => {
    const getSim = async (key) => {
      const sim = await fetchSimFull(key);
      setRawSim(sim);
    };

    if (simState === "Await") {
      getSim(key);
      setSimState("Done");
    }
  }, [key, simState]);

  const simClick = () => {
    setSimState("Await");
  };

  useEffect(() => {
    let clean = teams.map(function (x, i) {
      let mean_rank = "";
      try {
        mean_rank = rawSim[index]["sim_ranks"][x["team"]];
      } catch (e) {}
      return [
        x["team"],
        "./../teams/" + x["team"] + "|" + x["name"],
        mean_rank,
      ];
    });
    clean.sort((a, b) => a[2] - b[2]);
    clean = clean.map(function (x, i) {
      return [i + 1, x[0], x[1], x[2]];
    });
    setCleanSim(clean);
  }, [rawSim, teams, index]);

  const handleSliderChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  function getName(key) {
    if (key.slice(0, 2) === "qm") {
      return "Quals " + key.slice(2);
    } else if (key.slice(0, 2) === "qf") {
      return "Quarters " + key[2] + " Match " + key[4];
    } else if (key.slice(0, 2) === "sf") {
      return "Semis " + key[2] + " Match " + key[4];
    } else if (key[0] === "f") {
      return "Finals " + key[1] + " Match " + key[3];
    }
    return key;
  }

  function getMatchDisplays(matches) {
    const match_display = matches.map(function (x, i) {
      return (
        <Container className={styles.container} key={i}>
          <Row>
            <Col xs="2" className={styles.outline}>
              <b>{getName(x["match"])}</b>
            </Col>
            <Col xs="6" className={styles.outline}>
              <Row className={styles.red}>
                {x["red"].map(function (y, i) {
                  return (
                    <Col key={i}>
                      <a
                        className={styles.link}
                        href={`./../teams/${x["red"][i]}`}
                        children={
                          x["winner"] === "red" ? (
                            <b>{x["red"][i]}</b>
                          ) : (
                            x["red"][i]
                          )
                        }
                      />
                    </Col>
                  );
                })}
                <Col>
                  {x["winner"] === "red" ? (
                    <b>{x["red_score"]}</b>
                  ) : (
                    x["red_score"]
                  )}
                  {x["red_rp_1"] === 1 ? <sup>●</sup> : ""}
                  {x["red_rp_2"] === 1 ? <sup>●</sup> : ""}
                </Col>
              </Row>
              <Row className={styles.blue}>
                {x["blue"].map(function (y, i) {
                  return (
                    <Col key={i}>
                      <a
                        className={styles.link}
                        href={`./../teams/${x["blue"][i]}`}
                        children={
                          x["winner"] === "blue" ? (
                            <b>{x["blue"][i]}</b>
                          ) : (
                            x["blue"][i]
                          )
                        }
                      />
                    </Col>
                  );
                })}
                <Col>
                  {x["winner"] === "blue" ? (
                    <b>{x["blue_score"]}</b>
                  ) : (
                    x["blue_score"]
                  )}
                  {x["blue_rp_1"] === 1 ? <sup>●</sup> : ""}
                  {x["blue_rp_2"] === 1 ? <sup>●</sup> : ""}
                </Col>
              </Row>
            </Col>
            <Col xs="4" className={styles.outline}>
              <Row>
                <Col
                  className={
                    x["winner_correct"] ? styles.correct : styles.incorrect
                  }
                >
                  {x["winner_pred"] === "red" ? "Red" : "Blue"}
                </Col>
                {year >= 2016 ? (
                  <Col
                    className={
                      x["playoff"]
                        ? styles.none
                        : x["red_rp_1_correct"]
                        ? styles.correct
                        : styles.incorrect
                    }
                  >
                    {x["playoff"]
                      ? "-"
                      : parseInt(x["red_rp_1_prob"] * 100) + "%"}
                  </Col>
                ) : (
                  ""
                )}
                {year >= 2016 ? (
                  <Col
                    className={
                      x["playoff"]
                        ? styles.none
                        : x["red_rp_2_correct"]
                        ? styles.correct
                        : styles.incorrect
                    }
                  >
                    {x["playoff"]
                      ? "-"
                      : parseInt(x["red_rp_2_prob"] * 100) + "%"}
                  </Col>
                ) : (
                  ""
                )}
              </Row>
              <Row>
                <Col
                  className={
                    x["winner_correct"] ? styles.correct : styles.incorrect
                  }
                >
                  {parseInt(x["win_prob"] * 100) + "%"}
                </Col>
                {year >= 2016 ? (
                  <Col
                    className={
                      x["playoff"]
                        ? styles.none
                        : x["blue_rp_1_correct"]
                        ? styles.correct
                        : styles.incorrect
                    }
                  >
                    {x["playoff"]
                      ? "-"
                      : parseInt(x["blue_rp_1_prob"] * 100) + "%"}
                  </Col>
                ) : (
                  ""
                )}
                {year >= 2016 ? (
                  <Col
                    className={
                      x["playoff"]
                        ? styles.none
                        : x["blue_rp_2_correct"]
                        ? styles.correct
                        : styles.incorrect
                    }
                  >
                    {x["playoff"]
                      ? "-"
                      : parseInt(x["blue_rp_2_prob"] * 100) + "%"}
                  </Col>
                ) : (
                  ""
                )}
              </Row>
            </Col>
          </Row>
        </Container>
      );
    });

    return (
      <div>
        <Container className={styles.container} key={-1}>
          <Row>
            <Col xs="2" className={styles.outline}>
              Match Number
            </Col>
            <Col xs="6" className={styles.outline}>
              <Row>
                <Col>Team 1</Col>
                <Col>Team 2</Col>
                <Col>Team 3</Col>
                <Col>Score</Col>
              </Row>
            </Col>
            <Col xs="4" className={styles.outline}>
              <Row>
                <Col>Winner Pred</Col>
                {year >= 2016 ? <Col>RP 1 Pred</Col> : ""}
                {year >= 2016 ? <Col>RP 2 Pred</Col> : ""}
              </Row>
            </Col>
          </Row>
        </Container>
        {match_display}
      </div>
    );
  }

  return (
    <Paper className={styles.body}>
      <h2>
        {year} {event}
      </h2>
      <br />
      <Tabs defaultActiveKey="insights" id="tab">
        <Tab eventKey="insights" title="Insights">
          <ReactTable
            title="Current Statistics"
            columns={year >= 2016 ? columns : oldColumns}
            data={stats}
          />
        </Tab>
        <Tab eventKey="simulation" title="Simulation">
          <br />
          <h4>Simulation</h4>
          <Button
            variant="outline-dark"
            onClick={() => simClick()}
            className={styles.button}
          >
            <Typography>Load Simulation</Typography>
          </Button>
          <Slider
            defaultValue={0}
            onChangeCommitted={handleSliderChange}
            valueLabelDisplay="auto"
            marks
            step={1}
            min={0}
            max={quals}
          />
          <ReactTable
            title="Current Statistics"
            columns={simColumns}
            data={cleanSim}
          />
        </Tab>
        <Tab eventKey="Matches" title="Matches">
          <br />
          <h4>Match Predictions</h4>
          Remember, match predictions are just for fun, you control your own
          destiny!
          {year >= 2016 ? (
            <div>
              <b>Accuracy: {parseInt(acc * 1000) / 10}%</b>
              <br />
              <b>RP1 Accuracy: {parseInt(rp1Acc * 1000) / 10}%</b>
              <br />
              <b>RP2 Accuracy: {parseInt(rp2Acc * 1000) / 10}%</b>
            </div>
          ) : (
            <div>
              <b>Accuracy: {parseInt(acc * 1000) / 10}%</b>
            </div>
          )}
          <hr />
          <div className={styles.matches}>{getMatchDisplays(matches)}</div>
        </Tab>
      </Tabs>
    </Paper>
  );
}

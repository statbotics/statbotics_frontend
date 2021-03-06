import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";

import { Paper, Slider, Typography } from "@material-ui/core";
import { Tabs, Tab, Col, Row, Button } from "react-bootstrap";

import { ReactTable, useWindowDimensions } from "./../../../components";
import { default as getMatchDisplays } from "./MatchDisplay";
import { BarElo, BarOPR, Scatter } from "./Figures";

import RingLoader from "react-spinners/RingLoader";

import {
  fetchEvent,
  fetchTeamEvents,
  fetchMatches_Event,
  fetchSimIndex,
} from "./../../../api";

import { ilsMapping } from "./../../../constants";

import styles from "./EventView.module.css";

export default function EventView() {
  let { key } = useParams();
  const history = useHistory();

  const { height, width } = useWindowDimensions();

  const [done, setDone] = useState(false);

  const [event, setEvent] = useState("");
  const [year, setYear] = useState("");
  const [ILS1, setILS1] = useState("");
  const [ILS2, setILS2] = useState("");
  const [teams, setTeams] = useState([]);

  const [rp1Acc, setRp1Acc] = useState(0);
  const [rp2Acc, setRp2Acc] = useState(0);

  const [rawStats, setRawStats] = useState([]);
  const [stats, setStats] = useState([]);

  const [rawMatches, setRawMatches] = useState([]);
  const [qualMatches, setQualMatches] = useState([]);
  const [qualsAcc, setQualsAcc] = useState([]);
  const [elimMatches, setElimMatches] = useState([]);
  const [elimsAcc, setElimsAcc] = useState([]);
  const [numMatches, setNumMatches] = useState([]);

  const [quals, setQuals] = useState(50);
  const [index, setIndex] = useState(0);
  const [rawSim, setRawSim] = useState([]);
  const [cleanSim, setCleanSim] = useState([]);

  const [figState, setFigState] = useState("OPR");
  const [barOPRs, setBarOPRs] = useState([]);
  const [barElos, setBarElos] = useState([]);
  const [scatterOPRs, setScatterOPRs] = useState([]);
  const [scatterElos, setScatterElos] = useState([]);

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
    [ILS1, false, true, false, "ILS score (higher is better)"],
    [ILS2, false, true, false, "ILS score (higher is better)"],
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
    ["5% Rank", false, true, false, ""],
    ["Median Rank", false, true, false, ""],
    ["95% Rank", false, true, false, ""],
    ["Mean RPs", false, true, false, ""],
  ];

  console.log(height); //to prevent unused var warning
  console.log(width); //to prevent unused var warning

  useEffect(() => {
    if (
      year > 2000 &&
      event.length > 0 &&
      rawStats.length > 0 &&
      numMatches > 0
    ) {
      setDone(true);
    }
  }, [year, event, rawStats, numMatches]);

  useEffect(() => {
    const getEvent = async (key) => {
      const event = await fetchEvent(key);
      if (event === undefined) {
        history.push(`/404`);
        return;
      }
      setEvent(event["name"]);
      setYear(event["year"]);
      if (event["year"] >= 2016) {
        setILS1(ilsMapping[event["year"]][0]);
        setILS2(ilsMapping[event["year"]][1]);
      }
      setRp1Acc(event["rp1_acc"]);
      setRp2Acc(event["rp2_acc"]);
    };

    const getTeamEvents = async (key) => {
      const team_events = await fetchTeamEvents(key, "-elo_end");
      setRawStats(team_events);
    };

    const getMatches = async (key) => {
      const matches = await fetchMatches_Event(key);
      setRawMatches(matches);
    };

    setDone(false);
    setEvent("");
    setRawStats([]);
    setRawMatches([]);

    getEvent(key);
    getTeamEvents(key);
    getMatches(key);
  }, [key, history]);

  useEffect(() => {
    const getSim = async (key, index) => {
      const sim = await fetchSimIndex(key, index, 0);
      setRawSim(sim);
    };

    setRawSim([]);
    getSim(key, index);
  }, [key, index]);

  useEffect(() => {
    function clean(rawStats) {
      let cleanStats;
      let temp_teams = [];
      if (year >= 2016) {
        cleanStats = rawStats.map(function (x, i) {
          temp_teams.push({ team: x["team"], name: x["name"] });
          return [
            x["team"],
            "./../teams/" + x["team"] + "|" + x["name"],
            x["rank"] > 0 ? x["rank"] : "",
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
          temp_teams.push({ team: x["team"], name: x["name"] });
          return [
            x["team"],
            "./../teams/" + x["team"] + "|" + x["name"],
            x["rank"] > 0 ? x["rank"] : "",
            x["elo_end"],
            parseInt(x["opr_end"] * 10) / 10,
          ];
        });
      }
      setTeams(temp_teams);
      cleanStats.sort((a, b) => a[2] - b[2]);
      return cleanStats;
    }

    setStats(clean(rawStats));
  }, [year, rawStats]);

  useEffect(() => {
    function clean(rawMatches, year, playoffs) {
      if (!rawMatches) {
        return [];
      }

      let cleanMatches;

      let tempMatches = [];
      for (let i = 0; i < rawMatches.length; i++) {
        let prefix = rawMatches[i]["key"].split("_")[1].slice(0, 2);
        if ((prefix === "qm" && !playoffs) || (prefix !== "qm" && playoffs)) {
          tempMatches.push(rawMatches[i]);
        }
      }

      let correct = 0;
      let total = 0;
      if (year >= 2016) {
        cleanMatches = tempMatches.map(function (x, i) {
          total += 1;
          if (x["winner"] === x["mix_winner"]) {
            correct += 1;
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
        cleanMatches = tempMatches.map(function (x, i) {
          total += 1;
          if (x["winner"] === x["mix_winner"]) {
            correct += 1;
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
      return [cleanMatches, correct / total];
    }

    const quals = clean(rawMatches, year, false);
    setQualMatches(quals[0]);
    setQualsAcc(quals[1]);

    const elims = clean(rawMatches, year, true);
    setElimMatches(elims[0]);
    setElimsAcc(elims[1]);

    setQuals(quals[0].length);
    setNumMatches(quals.length + elims.length);
  }, [year, rawMatches]);

  useEffect(() => {
    let clean = teams.map(function (x, i) {
      let rank_mean = "";
      let rank_5 = "";
      let rank_median = "";
      let rank_95 = "";
      let rps_mean = "";
      try {
        rank_mean = rawSim["sim_ranks"][x["team"]];
        rps_mean = rawSim["mean_rps"][x["team"]];
        let cum_sum = 0;
        for (let j = 1; j <= teams.length; j++) {
          let prob = rawSim["sim_rank_probs"][x["team"]][j];
          cum_sum += prob;
          if (rank_5 === "" && cum_sum >= 0.05) {
            rank_5 = j;
          }
          if (rank_median === "" && cum_sum >= 0.5) {
            rank_median = j;
          }
          if (rank_95 === "" && cum_sum >= 0.95) {
            rank_95 = j;
          }
        }
      } catch (e) {}
      return [
        x["team"],
        "./../teams/" + x["team"] + "|" + x["name"],
        rank_mean,
        rank_5,
        rank_median,
        rank_95,
        rps_mean,
      ];
    });
    clean.sort((a, b) => a[2] - b[2]);
    clean = clean.map(function (x, i) {
      return [i + 1, x[0], x[1], x[2], x[3], x[4], x[5], x[6]];
    });
    setCleanSim(clean);
  }, [rawSim, teams, index]);

  const handleSliderChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  useEffect(() => {
    const getBarOPRs = (stats) => {
      let temp_stats = stats.slice();
      temp_stats.sort((a, b) => b[4] - a[4]);
      temp_stats = temp_stats.slice(0, 15);
      let oprs = [];
      if (year >= 2016) {
        oprs = temp_stats.map(function (x, i) {
          return {
            team: x[0].toString(),
            "Auto OPR": x[5],
            "Teleop OPR": x[6],
            "Endgame OPR": x[7],
          };
        });
      } else {
        oprs = temp_stats.map(function (x, i) {
          return {
            team: x[0].toString(),
            OPR: x[4],
          };
        });
      }
      setBarOPRs(oprs);
    };

    const getBarElos = (stats) => {
      let temp_stats = stats.slice();
      temp_stats.sort((a, b) => b[3] - a[3]);
      temp_stats = temp_stats.slice(0, 15);
      const elos = temp_stats.map(function (x, i) {
        return {
          team: x[0].toString(),
          Elo: x[3],
        };
      });
      setBarElos(elos);
    };

    const getScatterOPRs = (stats) => {
      const pairs = stats.map(function (a, i) {
        return {
          id: a[0].toString(),
          data: [{ x: a[2], y: a[4] }],
        };
      });
      setScatterOPRs(pairs);
    };

    const getScatterElos = (stats) => {
      const pairs = stats.map(function (a, i) {
        return {
          id: a[0].toString(),
          data: [{ x: a[2], y: a[3] }],
        };
      });
      setScatterElos(pairs);
    };

    if (stats.length > 0) {
      getBarOPRs(stats);
      getBarElos(stats);
      getScatterOPRs(stats);
      getScatterElos(stats);
    }
  }, [stats, year]);

  function FigClick() {
    if (figState === "OPR") {
      setFigState("Elo");
    } else {
      setFigState("OPR");
    }
  }

  function simTab() {
    if (quals === 0 || year === 2015 || year === 2010) {
      return <Tab eventKey="simulation" title="Simulation" disabled></Tab>;
    } else {
      return (
        <Tab
          eventKey="simulation"
          title="Simulation"
          tabClassName={width > 600 ? "" : styles.mobileTab}
        >
          <br />
          <h4>Simulation</h4>
          Using the Elo, OPR, and ILS statistics from a snapshot in time, we can
          simulate the remainder of the event. For each seed index, 100
          simulations are run and analyzed. The first tiebreaker is included
          from 2016 onwards.{" "}
          <b>
            The simulation happens live, and may take a few seconds to load. Be
            patient :)
          </b>
          <hr />
          Simulate from:
          {index === 0 ? " Schedule Release" : ` Qualification Match ${index}`}
          <div className={styles.slider}>
            <Slider
              defaultValue={0}
              onChangeCommitted={handleSliderChange}
              valueLabelDisplay="auto"
              marks
              step={1}
              min={0}
              max={quals}
            />
          </div>
          <ReactTable
            title="Ranking Simulation"
            columns={simColumns}
            data={cleanSim}
          />
        </Tab>
      );
    }
  }

  function getBarChart() {
    if (figState === "OPR") {
      const keys =
        year >= 2016 ? ["Auto OPR", "Teleop OPR", "Endgame OPR"] : ["OPR"];
      return (
        <div>
          <h5>Top 15 OPRs</h5>
          <BarOPR data={barOPRs} keys={keys} />
        </div>
      );
    } else {
      return (
        <div>
          <h5>Top 15 Elos</h5>
          <BarElo data={barElos} />
        </div>
      );
    }
  }

  function getScatterChart() {
    if (figState === "OPR") {
      return (
        <div>
          <h5>OPR vs Rank</h5>
          <Scatter data={scatterOPRs} axis={"OPR"} />
        </div>
      );
    } else {
      return (
        <div>
          <h5>Elo vs Rank</h5>
          <Scatter data={scatterElos} axis={"Elo"} />
        </div>
      );
    }
  }

  //Function Render Below

  if (done === false) {
    return (
      <div className={styles.center}>
        <RingLoader size={150} color={"#123abc"} loading={true} />
      </div>
    );
  }

  return (
    <Paper className={styles.body}>
      <h2>
        {year} {event}{" "}
        <a
          href={`https://www.thebluealliance.com/event/${key}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          (TBA)
        </a>
      </h2>
      <br />
      <Tabs defaultActiveKey="insights" id="tab">
        <Tab
          eventKey="insights"
          title="Insights"
          tabClassName={width > 600 ? "" : styles.mobileTab}
        >
          <br />
          <h4>Team Statistics</h4>
          <ReactTable
            title="Team Statistics"
            columns={year >= 2016 ? columns : oldColumns}
            data={stats}
          />
        </Tab>

        <Tab
          eventKey="Figures"
          title="Figures"
          tabClassName={width > 600 ? "" : styles.mobileTab}
        >
          <br />
          <Row>
            <Col xs="auto" className={styles.slider}>
              <h4>Figures!</h4>
            </Col>
            <Col>
              <Button
                variant="outline-dark"
                onClick={() => FigClick()}
                className={styles.button}
              >
                <Typography>
                  {figState === "OPR" ? "Show Elo" : "Show OPR"}
                </Typography>
              </Button>
            </Col>
          </Row>
          <hr />
          {getBarChart()}
          <hr />
          {getScatterChart()}
        </Tab>

        <Tab
          eventKey="Quals"
          title="Qual Matches"
          tabClassName={width > 600 ? "" : styles.mobileTab}
        >
          <br />
          <h4>Match Predictions</h4>
          Remember, match predictions are just for fun, you control your own
          destiny!
          {year >= 2016 ? (
            <div>
              <p>
                <b>Accuracy: {parseInt(qualsAcc * 1000) / 10}%</b>
                &nbsp;| RP1 Accuracy: {parseInt(rp1Acc * 1000) / 10}% &nbsp;|
                RP2 Accuracy: {parseInt(rp2Acc * 1000) / 10}%
              </p>
            </div>
          ) : (
            <div>
              <b>Accuracy: {parseInt(qualsAcc * 1000) / 10}%</b>
            </div>
          )}
          <hr />
          <div className={styles.matches}>
            {getMatchDisplays(year, qualMatches)}
          </div>
        </Tab>

        <Tab
          eventKey="Elims"
          title="Elim Matches"
          tabClassName={width > 600 ? "" : styles.mobileTab}
        >
          <br />
          <h4>Match Predictions</h4>
          Remember, match predictions are just for fun, you control your own
          destiny!
          <div>
            <b>Accuracy: {parseInt(elimsAcc * 1000) / 10}%</b>
          </div>
          <hr />
          <div className={styles.matches}>
            {getMatchDisplays(year, elimMatches)}
          </div>
        </Tab>

        {simTab()}
      </Tabs>
    </Paper>
  );
}

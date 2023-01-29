import React, { useContext } from "react";
import {
  Box,
  Divider,
  ListItem,
  ListItemText,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import ReorderIcon from "@mui/icons-material/Reorder";
import { Link, useNavigate } from "react-router-dom";
import { vibrate } from "../../utils";
import { styled } from "@mui/material/styles";
import AppContext from "../../AppContext";
import { useTranslation } from "react-i18next";
import SuccinctEtas from "./SuccinctEtas";
import { getDistanceWithUnit, toProperCase } from "../../utils";
import RouteNo from "../route-board/RouteNo";
import { Location } from "hk-bus-eta";

interface DistAndFareProps {
  name: string;
  location: Location;
  fares: string[] | null;
  faresHoliday: string[] | null;
  seq: number;
}

const DistAndFare = ({
  name,
  location,
  fares,
  faresHoliday,
  seq,
}: DistAndFareProps) => {
  const { t } = useTranslation();
  const { geoPermission, geolocation } = useContext(AppContext);
  const _fareString = fares && fares[seq] ? "$" + fares[seq] : "";
  const _fareHolidayString =
    faresHoliday && faresHoliday[seq] ? "$" + faresHoliday[seq] : "";
  const fareString = [_fareString, _fareHolidayString]
    .filter((v) => v)
    .join(", ");

  const { distance, unit, decimalPlace } = getDistanceWithUnit(
    location,
    geolocation
  );
  if (geoPermission !== "granted" || location.lat === 0) {
    return <>{name + "　" + (fareString ? "(" + fareString + ")" : "")}</>;
  }

  return (
    <>
      {name +
        " - " +
        distance.toFixed(decimalPlace) +
        t(unit) +
        "　" +
        (fareString ? "(" + fareString + ")" : "")}
    </>
  );
};

interface SuccinctTimeReportProps {
  routeId: string;
  disabled?: boolean;
}

const SuccinctTimeReport = ({
  routeId,
  disabled = false,
}: SuccinctTimeReportProps) => {
  const { t, i18n } = useTranslation();
  const {
    db: { routeList, stopList },
    vibrateDuration,
  } = useContext(AppContext);
  const [routeNo] = routeId.split("-");
  const [routeKey, seq] = routeId.split("/");
  const { co, stops, dest, fares, faresHoliday } =
    routeList[routeKey] || DefaultRoute;
  const stop = stopList[getStops(co, stops)[parseInt(seq, 10)]] || DefaultStop;

  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    vibrate(vibrateDuration);
    setTimeout(() => {
      navigate(`/${i18n.language}/route/${routeId.toLowerCase()}`);
    }, 0);
  };

  return (
    <>
      <RootListItem
        // @ts-ignore
        component={!disabled ? Link : undefined}
        to={`/${i18n.language}/route/${routeKey.toLowerCase()}`}
        onClick={!disabled ? handleClick : () => {}}
        className={classes.listItem}
      >
        <ListItemText primary={<RouteNo routeNo={routeNo} />} />
        <ListItemText
          primary={
            <Typography
              component="h3"
              variant="h6"
              color="textPrimary"
              className={classes.fromToWrapper}
            >
              <span className={classes.fromToText}>{t("往")}</span>
              <b>{toProperCase(dest[i18n.language])}</b>
            </Typography>
          }
          secondary={
            <DistAndFare
              name={toProperCase(stop.name[i18n.language])}
              location={stop.location}
              fares={fares}
              faresHoliday={faresHoliday}
              seq={parseInt(seq, 10)}
            />
          }
          secondaryTypographyProps={{
            component: "h4",
            variant: "subtitle2",
          }}
          className={classes.routeDest}
        />
        {!disabled ? (
          <SuccinctEtas routeId={routeId} />
        ) : (
          <Box sx={iconContainerSx}>
            <ReorderIcon />
          </Box>
        )}
      </RootListItem>
      <Divider />
    </>
  );
};

const DefaultRoute = {
  co: [""],
  stops: { "": [""] },
  dest: { zh: "", en: "" },
  bound: "",
  nlbId: 0,
  fares: [],
  faresHoliday: [],
};
const DefaultStop = { location: { lat: 0, lng: 0 }, name: { zh: "", en: "" } };

export default SuccinctTimeReport;

// TODO: better handling on buggy data in database
const getStops = (co, stops) => {
  for (let i = 0; i < co.length; ++i) {
    if (co[i] in stops) {
      return stops[co[i]];
    }
  }
};

const PREFIX = "succinctTimeReport";

const classes = {
  listItem: `${PREFIX}-listItem`,
  route: `${PREFIX}-route`,
  routeDest: `${PREFIX}-routeDest`,
  fromToWrapper: `${PREFIX}-fromToWrapper`,
  fromToText: `${PREFIX}-fromToText`,
};

const RootListItem = styled(ListItem)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(1),
  gridTemplateColumns: "15% 1fr minmax(18%, max-content)",
  [`&.${classes.listItem}`]: {
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    color: "rgba(0,0,0,0.87)",
  },
  [`& .${classes.routeDest}`]: {
    overflow: "hidden",
  },
  [`& .${classes.fromToWrapper}`]: {
    display: "flex",
    alignItems: "baseline",
  },
  [`& .${classes.fromToText}`]: {
    fontSize: "0.85rem",
    marginRight: theme.spacing(0.5),
  },
}));

const iconContainerSx: SxProps<Theme> = {
  color: (theme) => theme.palette.text.primary,
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

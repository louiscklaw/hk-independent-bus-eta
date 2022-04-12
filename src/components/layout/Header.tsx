import React, { useEffect, useCallback, useContext, useMemo } from "react";
import {
  Box,
  IconButton,
  Input,
  Tabs,
  Tab,
  Toolbar,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link, useLocation, useHistory, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppContext from "../../AppContext";
import { vibrate, checkMobile } from "../../utils";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const Header = () => {
  const {
    searchRoute,
    setSearchRoute,
    db: { routeList },
    colorMode,
    vibrateDuration,
    geoPermission,
    updateGeolocation,
  } = useContext(AppContext);
  const { path } = useRouteMatch();
  const { t, i18n } = useTranslation();
  let location = useLocation();
  const history = useHistory();

  const handleLanguageChange = (lang) => {
    vibrate(vibrateDuration);
    history.replace(location.pathname.replace("/" + i18n.language, "/" + lang));
    i18n.changeLanguage(lang);
  };

  const relocateGeolocation = useCallback(() => {
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          updateGeolocation({ lat: latitude, lng: longitude });
        }
      );
    } catch (e) {
      console.log("error in getting location");
    }
  }, [updateGeolocation]);

  const handleKeydown = useCallback(
    ({ key, ctrlKey, altKey, metaKey, target }: KeyboardEvent) => {
      // escape if key is functional
      if (ctrlKey || altKey || metaKey) return;
      // escape if any <input> has already been focused
      if ((target as HTMLElement).tagName.toUpperCase() === "INPUT") return;
      if ((target as HTMLElement).tagName.toUpperCase() === "TEXTAREA") return;

      if (key === "Escape") {
        setSearchRoute("");
      } else if (key === "Backspace") {
        setSearchRoute(searchRoute.slice(0, -1));
      } else if (key.length === 1) {
        setSearchRoute(searchRoute + key);
        history.replace(`/${i18n.language}/board`);
      }
    },
    // eslint-disable-next-line
    [searchRoute, i18n.language, setSearchRoute]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [handleKeydown]);

  return useMemo(
    () => (
      <AppToolbar className={classes.toolbar}>
        <Link
          to={`/${i18n.language}/board`}
          onClick={(e) => {
            e.preventDefault();
            vibrate(vibrateDuration);
            history.push(`/${i18n.language}/board`);
          }}
          rel="nofollow"
        >
          <Typography
            component="h1"
            variant="subtitle2"
            className={classes.appTitle}
          >
            {t("巴士到站預報")}
          </Typography>
        </Link>
        <Input
          id="searchInput"
          className={classes.searchRouteInput}
          type="text"
          value={searchRoute}
          placeholder={t("巴士線")}
          onChange={(e) => {
            if (
              e.target.value.toUpperCase() in routeList ||
              e.target.value in routeList
            ) {
              (document.activeElement as HTMLElement).blur();
              history.push(`/${i18n.language}/route/${e.target.value}`);
            }
            setSearchRoute(e.target.value);
          }}
          onFocus={(e) => {
            vibrate(vibrateDuration);
            if (navigator.userAgent !== "prerendering" && checkMobile()) {
              (document.activeElement as HTMLElement).blur();
            }
            history.replace(`/${i18n.language}/board`);
          }}
          disabled={path.includes("route")}
        />
        <Box className={classes.funcPanel}>
          {geoPermission === "granted" && (
            <IconButton
              aria-label="relocate"
              onClick={() => relocateGeolocation()}
            >
              <LocationOnIcon />
            </IconButton>
          )}
          <LanguageTabs
            className={classes.languageTabs}
            value={i18n.language}
            onChange={(e, v) => handleLanguageChange(v)}
          >
            <Tab
              disableRipple
              className={classes.languageTab}
              id="en-selector"
              value="en"
              label="En"
              component={Link}
              to={`${window.location.pathname.replace("/zh", "/en")}`}
              onClick={(e) => e.preventDefault()}
            />
            <Tab
              disableRipple
              className={classes.languageTab}
              id="zh-selector"
              value="zh"
              label="繁"
              component={Link}
              to={`${window.location.pathname.replace("/en", "/zh")}`}
              onClick={(e) => e.preventDefault()}
            />
          </LanguageTabs>
        </Box>
      </AppToolbar>
    ),
    // eslint-disable-next-line
    [
      searchRoute,
      i18n.language,
      location.pathname,
      colorMode,
      geoPermission,
      vibrateDuration,
    ]
  );
};

export default Header;

const PREFIX = "header";

const classes = {
  toolbar: `${PREFIX}-toolbar`,
  appTitle: `${PREFIX}-appTitle`,
  searchRouteInput: `${PREFIX}-searchRouteInput`,
  funcPanel: `${PREFIX}-funcPanel`,
  languageTabs: `${PREFIX}-languagetabs`,
  languageTab: `${PREFIX}-languagetab`,
};

const AppToolbar = styled(Toolbar)(({ theme }) => ({
  [`& .${classes.appTitle}`]: {
    color:
      theme.palette.mode === "dark"
        ? theme.palette.primary.main
        : theme.palette.text.primary,
  },
  [`&.${classes.toolbar}`]: {
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.background.default
        : theme.palette.primary.main,
    "& a": {
      color: "black",
      textDecoration: "none",
    },
    display: "flex",
    justifyContent: "space-between",
  },
  [`& .${classes.searchRouteInput}`]: {
    maxWidth: "50px",
    "& input": {
      textAlign: "center",
    },
    "& input::before": {
      borderBottom: `1px ${theme.palette.text.primary} solid`,
    },
  },
  [`& .${classes.funcPanel}`]: {
    display: "flex",
    alignItems: "center",
  },
}));

const LanguageTabs = styled(Tabs)(({ theme }) => ({
  [`&.${classes.languageTabs}`]: {
    borderBottom: "none",
    minHeight: 24,
    "& .MuiTabs-indicator": {
      backgroundColor: "transparent",
    },
  },
  [`& .${classes.languageTab}`]: {
    textTransform: "none",
    minWidth: 36,
    minHeight: 24,
    fontWeight: 900,
    marginRight: theme.spacing(0),
    fontSize: "15px",
    opacity: 1,
    padding: "6px 6px",
    "&.MuiTab-root": {
      color: theme.palette.text.primary,
      borderRadius: "30px",
      padding: "0px 10px 0px 10px",
    },
    "&.Mui-selected": {
      "&.MuiTab-root": {
        color: "black",
        backgroundColor:
          theme.palette.mode === "dark"
            ? theme.palette.primary.main
            : theme.palette.background.paper,
      },
    },
  },
}));

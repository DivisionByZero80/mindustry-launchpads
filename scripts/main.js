/** @param {SectorInfo} info */
const hasExports = (info) => {
  if (Version.build >= 135) {
    return info.anyExports();
  }
  if (info.export.size === 0) {
    return false;
  }
  // simulate anyExports logic from build 135
  let returnval = 0;
  info.export.each((_, e) => (returnval += e.mean));
  return returnval >= 0.01;
};

/** @param {UnlockableContent | TextureRegion | null} content */
const getIcon = (content) => {
  let icon = content;

  if (icon instanceof UnlockableContent) {
    icon = Version.build >= 135 ? icon.icon(Cicon.small) : icon.uiIcon;
  }

  if (icon instanceof TextureRegion) {
    return {
      drawable: new TextureRegionDrawable(icon),
      size: Version.build >= 135 ? Vars.iconSmall : 24,
    };
  }
  return null;
};

const getSectors = () => {
  const sectors = /** @type {Sector[]}*/ (
    Planets.serpulo.sectors.toArray()
  ).filter((sector) => hasExports(sector.info));

  const sectorInfo = sectors.map((sector) => ({
    source: [sector],
    icon: getIcon(sector.icon()),
    route:
      sector.name() +
      " -> " +
      (sector.info.destination ? sector.info.destination.name() : "None"),
  }));

  if (sectors.length >= 2) {
    sectorInfo.unshift({ source: sectors, icon: null, route: "Redirect All" });
  }
  return sectorInfo;
};

/**
 * @param {*} t
 * @param {string} text
 * @param {IconInfo|null} icon
 * @param {() => void} callback
 */
const createButton = (t, text, icon, callback) => {
  return icon !== null
    ? t.button(text, icon.drawable, icon.size, callback)
    : t.button(text, callback);
};

/**
 * @param {() => void} callback
 */
const addSelectionButton = (callback) => {
  Vars.ui.planet.shown(() => {
    if (Vars.ui.planet.mode === PlanetDialog.Mode.look) {
      const sectors = getSectors();
      if (sectors.length) {
        Vars.ui.planet.fill(
          cons((t) => {
            t.top().left().marginTop(5).marginLeft(5).defaults().size(200, 54);
            createButton(
              t,
              "Launchpads",
              getIcon(Blocks.launchPad),
              callback
            ).pad(2);
          })
        );
      }
    }
  });
};

/**
 * @param {Sector[]} sectors
 * @returns {Sector}
 */
const getSourceSector = (sectors) => {
  let sector;
  try {
    if (Version.build >= 135) {
      sector = Vars.ui.planet.state.planet.getLastSector();
    } else {
      sector = Vars.ui.planet.planets.planet.getLastSector();
    }
  } catch (e) {
    sector = null;
  }
  return sector === null ? sectors[0] : sector;
};

const getDestinationDialog = (() => {
  let dialog;
  return () => {
    if (!dialog) {
      dialog = extend(PlanetDialog, {
        playSelected() {
          this.listener.get(this.selected);
          this.hide();
        },
      });
    }
    return dialog;
  };
})();

/**
 * @param {(sources: Sector[], destination: Sector ) => void } callback
 */
const showSelectionDialog = (callback) => {
  const dialog = new BaseDialog("Launchpads");
  dialog.addCloseButton();
  const exportInfo = getSectors();
  dialog.cont
    .pane((t) =>
      exportInfo.forEach((sector) => {
        createButton(t, sector.route, sector.icon, () => {
          getDestinationDialog().showSelect(
            getSourceSector(sector.source),
            (/** @type {Sector} */ d) => callback(sector.source, d)
          );
          dialog.hide();
        })
          .growX()
          .pad(8);
        t.row();
      })
    )
    .size(400, 350);
  dialog.show();
};

Events.on(ClientLoadEvent, () => {
  addSelectionButton(() =>
    showSelectionDialog((sources, destination) => {
      sources.forEach((sector) =>
        Core.app.post(() => {
          sector.info.destination =
            sector.id !== destination.id ? destination : null;
          sector.saveInfo();
        })
      );
    })
  );
});

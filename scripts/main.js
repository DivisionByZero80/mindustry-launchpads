// () => { source: Sector[], route: string }[]
const getSectors = () => {
  const sectors = Planets.serpulo.sectors.toArray().filter((sector) => {
    return Version.build >= 135
      ? sector.info.anyExports()
      : sector.info.exports.size >= 0;
  });

  const sectorInfo = sectors.map((sector) => ({
    source: [sector],
    route:
      sector.name() +
      " -> " +
      (sector.info.getRealDestination()
        ? sector.info.getRealDestination().name()
        : "None"),
  }));

  if (sectors.length >= 2) {
    sectorInfo.unshift({ source: sectors, route: "Redirect All" });
  }
  return sectorInfo;
};

// ( cb: ( sectorInfo: { source: Sector[], route: string }[] ) => void ) => void
const addSelectionButton = (cb) => {
  Vars.ui.planet.shown(() => {
    if (Vars.ui.planet.mode === PlanetDialog.Mode.look) {
      const sectors = getSectors();
      if (sectors.length) {
        Vars.ui.planet.fill(
          cons((t) => {
            t.top().left().marginTop(5).marginLeft(5).defaults().size(200, 54);
            t.button(
              "Launchpads",
              new TextureRegionDrawable(Blocks.launchPad.uiIcon),
              Vars.iconSmall,
              () => cb(sectors)
            ).pad(2);
          })
        );
      }
    }
  });
};

// ( sectorInfo: { source: Sector[], route: string }[], cb: (sources: Sector[], destination: Sector ) => void ) => void
const showSelectionDialog = (sectorInfo, cb) => {
  const dialog = new BaseDialog("Launchpads");
  dialog.addCloseButton();
  dialog.cont
    .pane((t) =>
      sectorInfo.forEach((sector) => {
        t.button(sector.route, () => {
          Vars.ui.planet.showSelect(sector.source[0], (d) =>
            cb(sector.source, d)
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

// (sources: Sector[], destination: Sector ) => void
const updateDestinations = (sources, destination) => {
  sources.forEach(
    (sector) =>
      (sector.info.destination =
        sector.id !== destination.id ? destination : null)
  );
};

Events.on(ClientLoadEvent, () => {
  addSelectionButton((sectorInfo) =>
    showSelectionDialog(sectorInfo, updateDestinations)
  );
});

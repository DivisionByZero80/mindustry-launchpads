let dialog;

const prepareDialog = () => {
  dialog = extend(BaseDialog, "Exporting Sectors", {
    addSectorButton(t, text, sectors) {
      t.button(text, () => {
        Vars.ui.planet.showSelect(sectors[0].value, (d) =>
          sectors.forEach((sector) => {
            if (sector.value.id !== d.id) {
              sector.value.info.destination = d;
            }
          })
        );
        this.hide();
      })
        .growX()
        .pad(8);
      t.row();
    },
    rebuild(sectors) {
      this.cont.clear();
      this.cont
        .pane((t) => {
          this.addSectorButton(t, "Redirect All", sectors);
          sectors.forEach((sector) =>
            this.addSectorButton(t, sector.text, [sector])
          );
        })
        .size(400, 350);
    },
  });
  dialog.addCloseButton();
};

const openDialog = () => {
  const sectors = Planets.serpulo.sectors
    .toArray()
    .filter((sector) => sector.info.anyExports())
    .map((sector) => ({
      value: sector,
      text:
        sector.name() +
        " -> " +
        (sector.info.getRealDestination()
          ? sector.info.getRealDestination().name()
          : "Unknown"),
    }));

  Core.app.post(() => {
    dialog.rebuild(sectors);
    dialog.show();
  });
};

Events.on(ClientLoadEvent, () => {
  prepareDialog();
  Vars.ui.planet.shown(() => {
    if (Vars.ui.planet.mode === PlanetDialog.Mode.look) {
      Vars.ui.planet.fill(
        cons((t) => {
          t.top().left().marginTop(5).marginLeft(5);
          t.defaults().size(200, 54);
          t.button("Launchpads", Icon.downOpen, openDialog);
        })
      );
    }
  });
});

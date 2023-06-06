import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import { ContentsJsonImageIdiom } from "@expo/prebuild-config/build/plugins/icons/AssetContents";
import fs from "fs";
import path, { join } from "path";
import { customColorFromCSS } from "./customColorFromCSS";

export const withIosAccentColor: ConfigPlugin<{
  widgetName: string;
  color: string;
  darkColor?: string;
}> = (config, { widgetName, color, darkColor }) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      await setColorAsync(
        { color, darkColor },
        join(
          config.modRequest.projectRoot,
          widgetName,
          "Assets.xcassets/AccentColor.colorset"
        )
      );
      return config;
    },
  ]);
};

export const withIosWidgetBackgroundColor: ConfigPlugin<{
  widgetName: string;
  color: string;
  darkColor?: string;
}> = (config, { widgetName, color, darkColor }) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      await setColorAsync(
        { color, darkColor },
        join(
          config.modRequest.projectRoot,
          widgetName,
          "Assets.xcassets/WidgetBackground.colorset"
        )
      );
      return config;
    },
  ]);
};

type Appearance = {
  appearance: string;
  value: string;
};
type Color = {
  "color-space": "srgb";
  components: {
    alpha: number;
    blue: number;
    green: number;
    red: number;
  };
};

const DARK_APPEARANCE: Appearance = {
  appearance: "luminosity",
  value: "dark",
};

function createColor(color: string): Color {
  return {
    "color-space": "srgb",
    components: customColorFromCSS(color),
  };
}

export async function setColorAsync(
  { color, darkColor }: { color: string; darkColor?: string },
  colorsetFilePath: string
) {
  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs.promises.mkdir(colorsetFilePath, { recursive: true });

  // Store the image JSON data for assigning via the Contents.json
  const colorsJson: {
    appearances?: Appearance[];
    color: Color;
    idiom: ContentsJsonImageIdiom;
  }[] = [];

  if (color) {
    colorsJson.push({
      color: createColor(color),
      idiom: "universal",
    });
  }
  if (darkColor) {
    colorsJson.push({
      appearances: [DARK_APPEARANCE],
      color: createColor(darkColor),
      idiom: "universal",
    });
  }

  // Finally, write the Config.json
  await writeContentsJsonAsync(colorsetFilePath, {
    colors: colorsJson,
  });
}

async function writeContentsJsonAsync(directory, { colors }) {
  await fs.promises.mkdir(directory, { recursive: true });
  await fs.promises.writeFile(
    path.join(directory, "Contents.json"),
    JSON.stringify(
      {
        colors,
        info: {
          version: 1,
          // common practice is for the tool that generated the icons to be the "author"
          author: "expo",
        },
      },
      null,
      2
    )
  );
}

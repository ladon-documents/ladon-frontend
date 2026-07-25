#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

build_type=${1:-local}

directories=(
  "api"
  "globals"
  "style"
  "ui"
)

wc_directories=(
  "clipboard"
  "editor"
  "pdfviewer"
  "audioplayer"
  "imageeditor"
  "mediaplayer"
)

log_message() {
  echo -e "${GREEN}[BUNDLE]${NC} $1"
}

log_error() {
  echo -e "${RED}[FEHLER]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNUNG]${NC} $1"
}

OUTPUT_DIR="dist"
RELEASE_DIR="${2:-release}"

dependencies_are_valid() {
  local target_dir="$1"

  if [ ! -f "./$target_dir/package.json" ]; then
    return 1
  fi

  npm --prefix "./$target_dir" ls --depth=0 >/dev/null 2>&1
}

install_dependencies() {
  local target_dir="$1"

  if [ -f "./$target_dir/package-lock.json" ]; then
    log_message "Installiere Abhängigkeiten für ./$target_dir mit npm ci …"
    if ! npm ci --prefix "./$target_dir"; then
      log_warning "npm ci für ./$target_dir fehlgeschlagen (Lockfile nicht synchron?). Verwende npm install …"
      npm install --prefix "./$target_dir"
    fi
  else
    log_message "Installiere Abhängigkeiten für ./$target_dir mit npm install …"
    npm install --prefix "./$target_dir"
  fi
}

check_directories() {
  for dir in "${directories[@]}"; do
    if [ ! -d "./$dir" ]; then
      log_error "Verzeichnis ./$dir nicht gefunden. Bitte überprüfen Sie Ihre Projektstruktur."
      exit 1
    fi
  done
}

check_for_node_modules() {
  if [ ! -d "./node_modules" ]; then
    log_message "node_modules im Hauptverzeichnis nicht gefunden. Installiere Abhängigkeiten …"
    npm install
  fi

  for dir in "${directories[@]}"; do
    if [ ! -d "./$dir/node_modules" ]; then
      install_dependencies "$dir"
    elif ! dependencies_are_valid "$dir"; then
      log_warning "Abhängigkeiten in ./$dir sind unvollständig oder beschädigt. Installiere neu …"
      install_dependencies "$dir"
    fi
  done

  for wc_dir in "${wc_directories[@]}"; do
    if [ -d "./wc/$wc_dir" ]; then
      if [ ! -d "./wc/$wc_dir/node_modules" ]; then
        install_dependencies "wc/$wc_dir"
      elif ! dependencies_are_valid "wc/$wc_dir"; then
        log_warning "Abhängigkeiten in ./wc/$wc_dir sind unvollständig oder beschädigt. Installiere neu …"
        install_dependencies "wc/$wc_dir"
      fi
    fi
  done
}

build_webcomponents() {
  if [ ! -d "./wc" ]; then
    log_warning "WebComponents-Verzeichnis ./wc nicht gefunden. WebComponent-Build wird übersprungen."
    return
  fi

  log_message "Starte Build-Prozess für WebComponents …"

  for wc_dir in "${wc_directories[@]}"; do
    if [ -d "./wc/$wc_dir" ]; then
      log_message "Baue WebComponent: $wc_dir …"
      if [ -f "./wc/$wc_dir/package.json" ]; then
        npm --prefix "./wc/$wc_dir" run build
        log_message "WebComponent $wc_dir erfolgreich gebaut!"
      else
        log_warning "Keine package.json in ./wc/$wc_dir gefunden. Überspringe …"
      fi
    else
      log_warning "WebComponent-Verzeichnis ./wc/$wc_dir nicht gefunden. Überspringe …"
    fi
  done
}

sync_webcomponents() {
  log_message "Synchronisiere WebComponents für lokalen Build …"
  npm run sync:wc:local
}

build_all() {
  log_message "Starte den Build-Prozess für alle Projekte"

  log_message "Baue globals … 🤖"
  npm --prefix ./globals run build

  log_message "Baue styles … 🤖"
  npm --prefix ./style run build

  log_message "Baue alle APIs … 🤖"
  npm --prefix ./api run build:all

  log_message "Alle Projekte erfolgreich gebaut!"
}

create_release_package() {
  log_message "Erstelle Release-Paket …"

  rm -rf "$RELEASE_DIR"
  mkdir -p "$RELEASE_DIR"

  log_message "Kopiere Distributionsdateien …"

  if [ -d "./api/dist" ]; then
    cp -r ./api/dist/* "$RELEASE_DIR/"
  else
    log_warning "API dist-Verzeichnis nicht gefunden"
  fi

  if [ -d "./ui/dist" ]; then
    cp -r ./ui/dist/* "$RELEASE_DIR/"
  else
    log_warning "UI dist-Verzeichnis nicht gefunden"
  fi

  if [ -d "./style/dist" ]; then
    cp -r ./style/dist/* "$RELEASE_DIR/"
  else
    log_warning "Style dist-Verzeichnis nicht gefunden"
  fi

  if [ -d "./static" ]; then
    log_message "Kopiere statische Standalone-Views …"
    cp -r ./static "$RELEASE_DIR/"
    find "$RELEASE_DIR/static" -name "*.test.mjs" -delete
  else
    log_warning "Static-Verzeichnis nicht gefunden"
  fi

  if [ -d "./draco-rapids" ]; then
    log_message "Kopiere Draco Statics …"
    cp -r ./draco-rapids "$RELEASE_DIR/"
  else
    log_warning "Draco-Rapid-Verzeichnis nicht gefunden"
  fi

  if [ -d "./wc" ]; then
    log_message "Kopiere WebComponents …"
    mkdir -p "$RELEASE_DIR/webcomponents"

    for wc_dir in "${wc_directories[@]}"; do
      if [ -d "./wc/$wc_dir/dist" ]; then
        log_message "Kopiere WebComponent $wc_dir nach wc-$wc_dir …"
        mkdir -p "$RELEASE_DIR/webcomponents/wc-$wc_dir"
        cp -r "./wc/$wc_dir/dist/"* "$RELEASE_DIR/webcomponents/wc-$wc_dir/"
      else
        log_warning "WebComponent dist-Verzeichnis ./wc/$wc_dir/dist nicht gefunden"
      fi
    done
  fi

  cp package.json "$RELEASE_DIR/"
  cp ladon-plugin.json "$RELEASE_DIR/"
  if [ -f "ladon-plugin.md" ]; then
    cp ladon-plugin.md "$RELEASE_DIR/"
  fi
  if [ -f "releasenotes.md" ]; then
    cp releasenotes.md "$RELEASE_DIR/"
  fi

  if [ -f "README.md" ]; then
    cp README.md "$RELEASE_DIR/"
  fi

  log_message "Release-Paket erfolgreich erstellt in $RELEASE_DIR"
}

package_release() {
  log_message "🔧 Starte Paketierung des Release-Verzeichnisses …"
  if [ ! -d "$RELEASE_DIR" ]; then
    log_error "❌ Fehler: Release-Verzeichnis '$RELEASE_DIR' nicht gefunden."
    log_error "   Bitte führen Sie zuerst den Build-Prozess aus"
    exit 1
  fi

  log_message "📦 Führe npm pack im Verzeichnis '$RELEASE_DIR' aus …"
  cd "$RELEASE_DIR" || { log_error "❌ Fehler: Konnte nicht ins Verzeichnis wechseln"; exit 1; }

  PACKAGE_FILE=$(npm pack | tail -n 1)

  log_message "✅ Paketierung abgeschlossen: $PACKAGE_FILE wurde erstellt."
  log_message "   Vollständiger Pfad: $(pwd)/$PACKAGE_FILE"

  cd - > /dev/null

  log_message "🔄 Verschiebe Paket ins Hauptverzeichnis …"
  mv "$RELEASE_DIR/$PACKAGE_FILE" .
  log_message "🎉 Fertig! Paket befindet sich nun im Hauptverzeichnis: $PACKAGE_FILE"
}

main() {
  log_message "Starte Bundling-Prozess für ladon-frontend …"

  check_directories
  check_for_node_modules
  build_all
  build_webcomponents
  
  if [ "$build_type" == "local" ]; then
    sync_webcomponents
  fi
  
  if [ "$build_type" == "release" ]; then
    create_release_package
  fi
  
  log_message "Bundling abgeschlossen! Release-Paket wurde erstellt."
}

main

#ifndef APPS_PKG_INSTALLER_PKG_INSTALLER_H
#define APPS_PKG_INSTALLER_PKG_INSTALLER_H

/**
 * Package installer application entry point.
 * Simulates C library installation by managing entries in the virtual registry.
 *
 * @param arguments Optional command arguments (e.g., "install stdio").
 *                  Pass NULL or an empty string to enter interactive mode.
 */
void pkg_installer_run(const char *arguments);

#endif /* APPS_PKG_INSTALLER_PKG_INSTALLER_H */


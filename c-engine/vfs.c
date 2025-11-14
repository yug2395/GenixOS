#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>
#include <unistd.h>
#include "vfs.h"

static char project_root[256] = {0};
static char sandbox_root[256] = {0};

int vfs_init(const char *project_root_path, const char *sandbox_root_path) {
    strncpy(project_root, project_root_path, sizeof(project_root) - 1);
    strncpy(sandbox_root, sandbox_root_path, sizeof(sandbox_root) - 1);
    
    // Create directories if they don't exist
    mkdir(project_root, 0755);
    mkdir(sandbox_root, 0755);
    
    return 0;
}

int vfs_list(const char *path, char *output, size_t output_size) {
    char full_path[512];
    snprintf(full_path, sizeof(full_path), "%s/%s", project_root, path);
    
    DIR *dir = opendir(full_path);
    if (dir == NULL) {
        snprintf(output, output_size, "Error: Cannot open directory\n");
        return -1;
    }
    
    struct dirent *entry;
    size_t len = 0;
    
    while ((entry = readdir(dir)) != NULL && len < output_size - 1) {
        if (strcmp(entry->d_name, ".") != 0 && strcmp(entry->d_name, "..") != 0) {
            size_t name_len = strlen(entry->d_name);
            if (len + name_len + 1 < output_size) {
                strncpy(output + len, entry->d_name, output_size - len);
                len += name_len;
                output[len++] = '\n';
            }
        }
    }
    
    closedir(dir);
    output[len] = '\0';
    return 0;
}

int vfs_read(const char *path, char *content, size_t content_size) {
    char full_path[512];
    snprintf(full_path, sizeof(full_path), "%s/%s", project_root, path);
    
    FILE *fp = fopen(full_path, "r");
    if (fp == NULL) {
        return -1;
    }
    
    size_t len = fread(content, 1, content_size - 1, fp);
    content[len] = '\0';
    
    fclose(fp);
    return 0;
}

int vfs_write(const char *path, const char *content) {
    char full_path[512];
    snprintf(full_path, sizeof(full_path), "%s/%s", project_root, path);
    
    FILE *fp = fopen(full_path, "w");
    if (fp == NULL) {
        return -1;
    }
    
    fputs(content, fp);
    fclose(fp);
    return 0;
}


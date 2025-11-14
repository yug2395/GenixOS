#ifndef VFS_H
#define VFS_H

int vfs_init(const char *project_root, const char *sandbox_root);
int vfs_list(const char *path, char *output, size_t output_size);
int vfs_read(const char *path, char *content, size_t content_size);
int vfs_write(const char *path, const char *content);

#endif // VFS_H


function updateDeps(package, version) {
  for (const deps of [
    package.dependencies,
    package.optionalDependencies,
    package.devDependencies,
    package.requires
  ].filter(Boolean)) {
    for (const dep in deps) {
      if (dep.startsWith('@melodie')) {
        deps[dep] = version
      }
    }
  }
  return package
}

const updater = {
  readVersion(contents) {
    return JSON.parse(contents).version
  },
  writeVersion(contents, version) {
    const file = JSON.parse(contents)
    updateDeps(file, version).version = version
    if (file.packages) {
      for (const name in file.packages) {
        updateDeps(file.packages[name], version).version = version
      }
    }
    if (file.dependencies) {
      for (const name in file.dependencies) {
        updateDeps(file.dependencies[name], version)
      }
    }
    return JSON.stringify(file)
  }
}

module.exports = {
  bumpFiles: [
    {
      filename: 'package.json',
      updater
    },
    {
      filename: 'package-lock.json',
      updater
    },
    {
      filename: 'common/core/package.json',
      updater
    },
    {
      filename: 'common/ui/package.json',
      updater
    },
    {
      filename: 'apps/desktop/package.json',
      updater
    },
    {
      filename: 'apps/site/package.json',
      updater
    }
  ]
}

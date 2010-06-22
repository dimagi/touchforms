
def replace (str, find, repl):
  return repl.join(str.split(find))

def loads (data):
  return eval(replace(data, 'null', 'None'))

def dumps (data):
  dt = str(type(data)).split("'")[1]
  #print dt, data
  
  if dt == 'NoneType':
    return 'null'
  if dt in ('int', 'float'):
    return str(data)
  elif dt in ('str', 'unicode'):
    return '"%s"' % replace(replace(data, '\\', '\\\\'), '"', '\\"')
  elif dt == 'bool':
    return 'true' if data else 'false'
  elif dt in ('list', 'tuple'):
    return '[%s]' % ', '.join(dumps(e) for e in data)
  elif dt == 'dict':
    return '{%s}' % ', '.join('%s: %s' % (dumps(k), dumps(v)) for (k, v) in data.iteritems())
  elif dt in ('datetime.datetime', 'datetime.date'):
    return dumps(data.strftime('%Y-%m-%d'))
  elif dt == 'org.javarosa.core.model.SelectChoice':
    return dumps(data.getCaption())
const Platform = {
  OS: 'ios',
  select: jest.fn(obj => obj.ios),
};

module.exports = {
  Platform,
};

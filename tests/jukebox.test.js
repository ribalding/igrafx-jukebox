
var JukeboxManager = require('../backend/jukeboxmanager');
var fakePlaylistData = {
    items: [
        {
            track: { id: 100 }
        },
        {
            track: { id: 200 }
        },
        {
            track: { id: 300 }
        }
    ]
};


// TESTS

test('map random tracks', () => {
    var jm = new JukeboxManager();
    jm.randomTrackIds = {};
    var output = {};
    output.items = jm.mapRandomTracks(fakePlaylistData);

    var firstItem = output.items[0];
    var secondItem = output.items[1];
    var thirdItem = output.items[2];
    expect(firstItem.track.isRandom).toBeFalsy();
    expect(secondItem.track.isRandom).toBeFalsy();
    expect(thirdItem.track.isRandom).toBeFalsy();

    //Now add some randomTrackIds
    jm.randomTrackIds[100] = true;
    output.items = jm.mapRandomTracks(fakePlaylistData);
    firstItem = output.items[0];
    secondItem = output.items[1];
    thirdItem = output.items[2];
    expect(firstItem.track.isRandom).toBeTruthy();
    expect(secondItem.track.isRandom).toBeFalsy();
    expect(thirdItem.track.isRandom).toBeFalsy();

});

test('map data for track removal', () => {
    var jm = new JukeboxManager();
    expect(jm.mapDataForTrackRemoval(['100', '200', '300'])).toStrictEqual(
        [
            { uri: 'spotify:track:100'}, 
            { uri: 'spotify:track:200'}, 
            { uri: 'spotify:track:300'}
        ]
    );
});
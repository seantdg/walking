docker rm -f some-mongo some-office-walk
docker run -it --name some-mongo -d mongo
docker build -t laughingbiscuit/office-walk .
docker run -p 3000:3000 --link some-mongo:mongo -itd --name some-office-walk laughingbiscuit/office-walk

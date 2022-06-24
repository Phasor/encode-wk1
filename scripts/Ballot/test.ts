async function main(){
    console.log(process.argv[4]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  
#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

float hash(vec2 p, float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sin(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4))) * 2.1);
	return ret;
}

float noise(vec2 p, float s)
{
	vec2 i = floor(p);
	vec2 f = fract(p);

	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0, 0.0), s), hash(i + vec2(1.0, 0.0), s), f.x),
					mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), f.x),
					f.y) * s;

	return ret;
}

float fbm(vec2 p)
{
	float v = -4.0;
	v += noise(p * 2.0, 0.4);
	v += 0.5 - noise(-p * 4.0, 0.27);

	float ret = 20.0 * length(sin(v * 3.0) + cos(v * 0.85));
	return ret;
}

float lanczosKernel(int ai, float x)
{
	float ret;
	float af = float(ai);

	if (x == 0.0)
		return 1.0;
	if (-af <= x && x < af)
		return (af * sin(PI * x) * sin((PI * x) / af)) / ((PI * PI) * (x * x));
	else
		return 0;
}

float lanczosInterp(int ai, float x)
{
	float ret = 0.0;
	int ub = int(floor(x));
	int lb = int(floor(x)) - ai + 1;

	for (int i = lb; i <= ub; i++)
	{
		ret += uSpectrum[i] * lanczosKernel(ai, x - float(i));
		//ret = mod(abs(ret), 1.0);
	}

	return abs(ret);
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(TAU + a), sin(PI * a),
		-sinc(PI * a), cos(TAU * a)
	);

	return ret;
}

float perlin(vec2 p, float f)
{
	mat2 m = mat2(2.0);
	float v = 0.0;
	float s = 1.0;

	for (int i = 0; i < 7; i++, s /= 2.0)
	{
		v += s * noise(p, f);
		p *= m;
	}

	return v;
}

vec3 col(vec2 p)
{
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	float ff = fract(f * 100.0);
	float lkf = lanczosKernel(2, f);
	float lkff = lanczosKernel(2, ff);
	float lif = lanczosInterp(3, sin(f) * 100.0 * TAU);
	float liff = lanczosInterp(3, sin(ff) * 1000.0 * TAU / p.x);
	float t = uTime * 0.3;// + mod(ff, 0.15);

	float ffd = max(lkff, liff) / min(lkff, liff);
	float fd = max(lkf, lif) / min(lkf, lif);

	vec2 q = p;
	q.x *= uRes.x / uRes.y;
	//q.y *= sin(q.x * f + sin(uTime));// * 4.0;
	q *= rot(sin(t) + cosc(t / (1.0 - uDeltaFreq)) * liff / length(p));

//	vec3 c = vec3(0.2, 0.4 - q.x, 0.98 + q.y);
	vec3 c = vec3(
		sin(fd) + cos(uTime * fbm(vec2(uFreq, lif))) + sinc(1.0 - abs(uDeltaFreq)),
		sin(PI / fd) / ((dot(sin(q), cos(p)) * 0.5) * 2.0),
		smoothstep(fd, ffd, lkff) + atan(cosc(lkf))
	);

	c.g *= 0.25;
	float a = perlin(q, f);// * 5.0;

	for (float i = 1.0; i <= 10.0 + liff; ++i)
	{
		float s = abs(
		0.8//	(liff + lkf) 
						/ 
			(
					(-(1.0 / ffd + sin(uTime) * f) - q.x + fbm(q + t / i)) 
							* 
					(i * 15.0 * perlin(sin(q), lkf))
				)
			);
		a += s;
	}

	c *= perlin(fract(q), a - liff);
	vec3 ret;
	ret = c;

	ret *= f;
	//ret *= perlin(q, f);

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy / uRes.xy);
	vec4 ret;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}
